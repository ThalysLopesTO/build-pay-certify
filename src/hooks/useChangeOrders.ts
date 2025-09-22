import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeyFactory";
import { CACHE_STRATEGIES } from "@/lib/optimizedQueryClient";
import { useSmartMutation } from "./useSmartMutation";

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
    photo_url?: string;
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

  // Debug logging for user context
  console.log("useChangeOrders hook - User context:", {
    userId: user?.id,
    companyId: user?.companyId,
    role: user?.role,
    queryEnabled: !!user?.companyId
  });

  const query = useQuery({
    queryKey: queryKeys.changeOrder.list(user?.companyId || ''),
    queryFn: async () => {
      console.log("Fetching change orders for company:", user?.companyId);
      
      if (!user?.companyId) {
        console.error("No companyId available for query");
        throw new Error("Company ID is required");
      }

      const { data, error } = await supabase
        .from("change_orders")
        .select(`
          *,
          creator:user_profiles!change_orders_created_by_fkey(first_name, last_name, photo_url)
        `)
        .eq('company_id', user.companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Change orders query error:", error);
        throw error;
      }
      console.log("Successfully fetched change orders:", data?.length || 0, "orders");
      return data as ChangeOrder[];
    },
    enabled: !!user?.companyId,
    ...CACHE_STRATEGIES.DYNAMIC,
  });

  const createMutation = useSmartMutation({
    mutationFn: async (data: CreateChangeOrderData) => {
      console.log("Creating change order with data:", data);
      console.log("User context for creation:", { userId: user?.id, companyId: user?.companyId });

      if (!user?.companyId || !user?.id) {
        throw new Error("User context incomplete - missing company ID or user ID");
      }

      const { data: result, error } = await supabase
        .from("change_orders")
        .insert({
          ...data,
          company_id: user.companyId,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Failed to create change order:", error);
        throw error;
      }
      
      console.log("Successfully created change order:", result);
      return result;
    },
    queryKey: queryKeys.changeOrder.list(user?.companyId || ''),
    successMessage: "Change order created successfully",
    errorMessage: "Failed to create change order",
    onSuccessUpdate: async (data, queryClient) => {
      // Force immediate refetch to ensure UI updates
      console.log("Invalidating change orders cache after successful creation");
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.changeOrder.list(user?.companyId || '') 
      });
    },
  });

  const updateMutation = useSmartMutation({
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
    queryKey: queryKeys.changeOrder.list(user?.companyId || ''),
    successMessage: "Change order updated successfully",
    errorMessage: "Failed to update change order",
  });

  const deleteMutation = useSmartMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("change_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    queryKey: queryKeys.changeOrder.list(user?.companyId || ''),
    successMessage: "Change order deleted successfully",
    errorMessage: "Failed to delete change order",
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