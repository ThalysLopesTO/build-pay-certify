import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";

export interface ChangeOrder {
  id: string;
  company_id: string;
  project_id: string;
  created_by: string;
  title: string;
  description: string;
  type: 'admin' | 'foreman_request';
  order_type: 'change' | 'extra';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  cost?: number;
  start_date?: string;
  end_date?: string;
  attachments: string[];
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
  project?: {
    name: string;
  };
  reviewer?: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateChangeOrderData {
  title: string;
  description: string;
  project_id: string;
  type: 'admin' | 'foreman_request';
  order_type: 'change' | 'extra';
  cost?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'submitted';
  attachments?: string[];
}

export interface UpdateChangeOrderData {
  title?: string;
  description?: string;
  project_id?: string;
  type?: 'admin' | 'foreman_request';
  order_type?: 'change' | 'extra';
  cost?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  reviewed_by?: string;
  reviewed_at?: string;
  attachments?: string[];
}

export const useChangeOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["change-orders"],
    queryFn: async () => {
      console.log("Fetching change orders...");
      const { data, error } = await supabase
        .from("change_orders")
        .select(`
          *,
          creator:user_profiles!created_by(first_name, last_name),
          project:jobsites!project_id(name),
          reviewer:user_profiles!reviewed_by(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Change orders query error:", error);
        throw error;
      }
      console.log("Fetched change orders:", data);
      return data as ChangeOrder[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateChangeOrderData) => {
      const { data: result, error } = await supabase
        .from("change_orders")
        .insert({
          ...data,
          company_id: user?.companyId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-orders"] });
      toast.success("Change order created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create change order");
      console.error("Create change order error:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateChangeOrderData }) => {
      const updateData: any = { ...data };
      
      // Set review fields when approving/rejecting
      if (data.status && ['approved', 'rejected'].includes(data.status)) {
        updateData.reviewed_by = user?.id;
        updateData.reviewed_at = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from("change_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-orders"] });
      toast.success("Change order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update change order");
      console.error("Update change order error:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("change_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-orders"] });
      toast.success("Change order deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete change order");
      console.error("Delete change order error:", error);
    },
  });

  return {
    changeOrders: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createChangeOrder: createMutation.mutate,
    updateChangeOrder: updateMutation.mutate,
    deleteChangeOrder: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useAdminChangeOrders = () => {
  const { changeOrders, ...rest } = useChangeOrders();
  
  const adminOrders = changeOrders.filter(order => order.type === 'admin');
  const foremanRequests = changeOrders.filter(order => order.type === 'foreman_request');
  
  return {
    adminOrders,
    foremanRequests,
    allChangeOrders: changeOrders,
    ...rest,
  };
};

export const useForemanChangeOrderRequests = () => {
  const { user } = useAuth();
  const { changeOrders, ...rest } = useChangeOrders();
  
  const myRequests = changeOrders.filter(order => 
    order.type === 'foreman_request' && order.created_by === user?.id
  );
  
  return {
    myRequests,
    allChangeOrders: changeOrders,
    ...rest,
  };
};