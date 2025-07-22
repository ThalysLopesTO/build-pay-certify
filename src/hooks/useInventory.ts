
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface InventoryItem {
  id: string;
  jobsite_id: string;
  equipment_name: string;
  brand: string;
  sku: string;
  start_date: string;
  return_date: string | null;
  created_by: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  status?: 'assigned' | 'available' | 'returned' | 'maintenance';
  jobsites?: {
    name: string;
    address: string | null;
  };
}

export interface CreateInventoryItem {
  jobsite_id: string;
  equipment_name: string;
  brand: string;
  sku: string;
  start_date: string;
  return_date?: string | null;
}

export const useInventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ['inventory', user?.companyId],
    queryFn: async () => {
      console.log('Fetching inventory for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
      
      console.log('Inventory fetched:', data);
      
      // Add status field based on return_date
      const inventoryWithStatus = data.map(item => {
        let status = 'assigned';
        if (!item.jobsite_id) {
          status = 'available';
        } else if (item.return_date) {
          status = 'returned';
        }
        return { ...item, status };
      });
      
      return inventoryWithStatus as InventoryItem[];
    },
    enabled: !!user?.companyId,
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (newItem: CreateInventoryItem) => {
      console.log('Creating inventory item:', newItem);
      
      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          ...newItem,
          created_by: user?.id,
          company_id: user?.companyId,
        }])
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .single();

      if (error) {
        console.error('Error creating inventory item:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Success",
        description: "Inventory item created successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to create inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to create inventory item",
        variant: "destructive",
      });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateInventoryItem> }) => {
      console.log('Updating inventory item:', id, updates);
      
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .single();

      if (error) {
        console.error('Error updating inventory item:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to update inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting inventory item:', id);
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting inventory item:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to delete inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    },
  });

  const setAsReturnedMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Setting inventory item as returned:', id);
      
      const currentDate = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('inventory')
        .update({ return_date: currentDate })
        .eq('id', id)
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .single();

      if (error) {
        console.error('Error marking item as returned:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Success",
        description: "Item marked as returned successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to mark item as returned:', error);
      toast({
        title: "Error",
        description: "Failed to mark item as returned",
        variant: "destructive",
      });
    },
  });

  return {
    inventory: inventoryQuery.data || [],
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    createItem: createInventoryMutation.mutateAsync,
    updateItem: updateInventoryMutation.mutateAsync,
    deleteItem: deleteInventoryMutation.mutateAsync,
    setAsReturned: setAsReturnedMutation.mutateAsync,
    isCreating: createInventoryMutation.isPending,
    isUpdating: updateInventoryMutation.isPending,
    isDeleting: deleteInventoryMutation.isPending,
    isReturning: setAsReturnedMutation.isPending,
  };
};
