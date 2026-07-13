import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEmployeeLimit } from "../useEmployeeLimit";
import { useToast } from "../use-toast";

export type Employee = {
  id: string;
  user_id: string;
  company_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  role: string;
  trade?: string;
  position?: string;
  hourly_rate?: number;
  photo_url?: string;
  worker_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  date_of_birth?: string | null;
  companies?: {
    name: string;
  };
}

export function useUserProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Scope to the active company (a user may belong to several companies);
      // super_admins have no companyId, so fall back to their single row
      let query = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id);
      if (user.companyId) {
        query = query.eq('company_id', user.companyId);
      }
      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });
}

export interface EmployeesQueryResponse {
  employees: Employee[];
  activeEmployees: Employee[];
  archivedEmployees: Employee[];
  activeEmployeeCount: number;
  archivedEmployeesCount: number;
}

export const useEmployees = () => {
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  return useQuery<EmployeesQueryResponse | null, Error>({
    queryKey: ['employees', profile?.company_id],
    queryFn: async () => {
      if (!profile) return null; // skip fetch if no user
      console.log({ profile })
      // Fetch employees in the same company
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `)
        .eq('company_id', profile.company_id)
        .in('role', ['employee', 'foreman', 'admin', 'management'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const employees = data || [];
      const activeEmployees = employees.filter(emp => emp.is_active);
      const archivedEmployees = employees.filter(emp => !emp.is_active);

      return {
        employees,
        activeEmployees,
        archivedEmployees,
        activeEmployeeCount: activeEmployees.length,
        archivedEmployeesCount: archivedEmployees.length
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false, // optional, prevent auto refetch on window focus
    enabled: !!profile?.company_id && !profileLoading,
  });
};

export const IsCanAddEmployee = () => {
  const { data: employeeLimit } = useEmployeeLimit();
  return employeeLimit && employeeLimit.currentCount < employeeLimit.employeeLimit
}

export function useIsAdmin() {
  const { user } = useAuth();

  return (
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "management"
  );
}

type UpdateEmployeeArgs = {
  id: string;
  updates: Partial<Employee>;
  newPhoto?: File;
  isEmailChanged: boolean;
};

export function useUpdateEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates, newPhoto, isEmailChanged }: UpdateEmployeeArgs) => {
      if (id.startsWith("temp-")) {
        throw new Error("Cannot update employee with temporary ID. Refresh and try again.");
      }

      let photoUrl = updates.photo_url;

      // Step 1: Upload photo if provided
      if (newPhoto) {
        const ext = newPhoto.name.split(".").pop();
        const fileName = `${id}.${ext}`;

        const uploadResult = await withTimeout(
          supabase.storage
            .from("employee-photos")
            .upload(fileName, newPhoto, { cacheControl: "3600", upsert: true }),
          15000,
          "Photo upload timed out after 15 seconds"
        );

        if (uploadResult.error) throw new Error("Failed to upload employee photo");

        const { data: publicUrlData } = supabase.storage
          .from("employee-photos")
          .getPublicUrl(fileName);

        photoUrl = publicUrlData.publicUrl;
      }

      // Step 2: Update DB
      const updateResult = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (updateResult.error) {
        throw new Error(`Database update failed: ${updateResult.error.message || "Unknown"}`);
      }
      if (!updateResult.data) {
        throw new Error("Employee not found or update failed - no data returned");
      }

      const finalEmployee = { ...updateResult.data, photo_url: photoUrl };

      // Step 3: Update auth email if changed
      if (isEmailChanged) {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          "update-user-email",
          { body: { userId: finalEmployee.user_id, newEmail: updates.email } }
        );

        if (emailError || !emailData?.success) {
          toast({
            title: "Partial Update",
            description: "Profile updated, but login email update failed. Contact support.",
            variant: "destructive",
          });
        }
      }

      // Invalidate queries
      await queryClient.invalidateQueries({
        queryKey: ["user-profile", finalEmployee.user_id],
      });
      if (finalEmployee.user_id === user?.id) {
        await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      }

      return finalEmployee;
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    },
    // Success toast
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"], exact: false });
      toast({
        title: "Employee Updated",
        description: `Employee has been updated successfully.`,
      });
    },
  });
}

export type ToggleEmployeeArgs = {
  id: string;
  isActive: boolean; // pass true for activate, false for archive
};

export function useToggleEmployeeStatus() {
  const {toast} = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: ToggleEmployeeArgs) => {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(
          `Database update failed: ${error.message || "Unknown"}`
        );
      }
      if (!data) {
        throw new Error("Employee not found or update failed - no data returned");
      }

      return data;
    },

    onError: (error: any, { isActive }) => {
      toast({
        title: `${isActive ? "Activation" : "Archive"} Failed`,
        description:
          error.message ||
          `Failed to ${isActive ? "activate" : "archive"} employee`,
        variant: "destructive",
      });
    },

    onSuccess: async (employee, { isActive }) => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      await queryClient.invalidateQueries({
        queryKey: ["user-profile", employee.id],
      });

      toast({
        title: `Employee ${isActive ? "Activated" : "Archived"}`,
        description: `${employee.first_name} ${employee.last_name} has been ${
          isActive ? "activated" : "archived"
        } successfully.`,
      });
    },
  });
}

export function useDeleteEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log("🗑️ Deleting (archiving) employee:", id);

      const { data, error } = await supabase.rpc("delete_employee", {
        employee_user_id: id,
      });

      if (error || !(data as any)?.success) {
        throw new Error((data as any)?.error || "Failed to delete employee");
      }

      return { id, data };
    },

    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });

      toast({
        title: "Success",
        description: `Employee ${id} has been archived successfully`,
      });
    },

    onError: (error: any) => {
      console.error("❌ Error deleting employee:", error);

      toast({
        title: "Error",
        description: error.message || "Error deleting employee",
        variant: "destructive",
      });
    },
  });
}

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ]);
  };