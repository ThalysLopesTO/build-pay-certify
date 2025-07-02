import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MaterialTakeoff {
  id: string;
  jobsite_id: string;
  company_id: string;
  material_name: string;
  unit: string;
  total_qty_estimated: number;
  unit_price: number;
  subtotal: number;
  requested_qty: number;
  remaining_qty: number;
  status: 'not_requested' | 'partially_requested' | 'fully_requested';
  vendor?: string;
  notes?: string;
  category?: string;
  priority: number;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  jobsite_name?: string;
  jobsite_address?: string;
}

export interface CreateMaterialTakeoff {
  jobsite_id: string;
  company_id: string;
  material_name: string;
  unit: string;
  total_qty_estimated: number;
  unit_price: number;
  created_by: string;
  vendor?: string;
  notes?: string;
  category?: string;
  priority?: number;
  is_draft?: boolean;
}

export interface MaterialTakeoffFilters {
  jobsite_id?: string;
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse {
  data: MaterialTakeoff[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const useMaterialTakeoffsPaginated = (filters: MaterialTakeoffFilters = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['material-takeoffs-paginated', user?.companyId, filters],
    queryFn: async (): Promise<PaginatedResponse> => {
      if (!user?.companyId) return { data: [], total_count: 0, page: 1, limit: 25, total_pages: 0 };

      const { data, error } = await supabase.rpc('get_material_takeoffs_paginated', {
        p_company_id: user.companyId,
        p_jobsite_id: filters.jobsite_id === 'all' ? null : filters.jobsite_id || null,
        p_search: filters.search || null,
        p_status: filters.status === 'all' ? null : filters.status || null,
        p_category: filters.category === 'all' ? null : filters.category || null,
        p_page: filters.page || 1,
        p_limit: filters.limit || 25,
      });

      if (error) {
        console.error('Error fetching paginated takeoffs:', error);
        throw error;
      }

      const total_count = data?.[0]?.total_count || 0;
      const limit = filters.limit || 25;
      const page = filters.page || 1;
      
      return {
        data: (data || []).map(item => ({
          ...item,
          status: item.status as 'not_requested' | 'partially_requested' | 'fully_requested'
        })) as MaterialTakeoff[],
        total_count,
        page,
        limit,
        total_pages: Math.ceil(total_count / limit),
      };
    },
    enabled: !!user?.companyId,
  });
};

export const useMaterialTakeoffMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['material-takeoffs-paginated'] });
    queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
  };

  const createTakeoff = useMutation({
    mutationFn: async (takeoff: CreateMaterialTakeoff) => {
      const { data, error } = await supabase
        .from('material_takeoffs')
        .insert([takeoff])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: 'Success',
        description: 'Material takeoff item created successfully',
      });
    },
    onError: (error) => {
      console.error('Create takeoff error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create material takeoff item',
        variant: 'destructive',
      });
    },
  });

  const updateTakeoff = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MaterialTakeoff> }) => {
      const { data, error } = await supabase
        .from('material_takeoffs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: 'Success',
        description: 'Material takeoff item updated successfully',
      });
    },
    onError: (error) => {
      console.error('Update takeoff error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update material takeoff item',
        variant: 'destructive',
      });
    },
  });

  const deleteTakeoff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('material_takeoffs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: 'Success',
        description: 'Material takeoff item deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Delete takeoff error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete material takeoff item',
        variant: 'destructive',
      });
    },
  });

  const bulkInsert = useMutation({
    mutationFn: async (takeoffs: CreateMaterialTakeoff[]) => {
      const { data, error } = await supabase.rpc('bulk_insert_material_takeoffs', {
        takeoffs_data: JSON.stringify(takeoffs),
      });

      if (error) throw error;
      return data as { inserted_count: number; error_count: number };
    },
    onSuccess: (result) => {
      invalidateQueries();
      toast({
        title: 'Bulk Import Complete',
        description: `Imported ${result.inserted_count} items successfully. ${result.error_count} errors.`,
      });
    },
    onError: (error) => {
      console.error('Bulk insert error:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import material takeoff items',
        variant: 'destructive',
      });
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      const { data, error } = await supabase.rpc('bulk_update_material_takeoffs', {
        takeoff_ids: ids,
        updates: updates,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      invalidateQueries();
      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${result} items successfully`,
      });
    },
    onError: (error) => {
      console.error('Bulk update error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update material takeoff items',
        variant: 'destructive',
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc('bulk_delete_material_takeoffs', {
        takeoff_ids: ids,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      invalidateQueries();
      toast({
        title: 'Bulk Delete Complete',
        description: `Deleted ${result} items successfully`,
      });
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete material takeoff items',
        variant: 'destructive',
      });
    },
  });

  return {
    createTakeoff: createTakeoff.mutate,
    updateTakeoff: updateTakeoff.mutate,
    deleteTakeoff: deleteTakeoff.mutate,
    bulkInsert: bulkInsert.mutate,
    bulkUpdate: bulkUpdate.mutate,
    bulkDelete: bulkDelete.mutate,
    isCreating: createTakeoff.isPending,
    isUpdating: updateTakeoff.isPending,
    isDeleting: deleteTakeoff.isPending,
    isBulkInserting: bulkInsert.isPending,
    isBulkUpdating: bulkUpdate.isPending,
    isBulkDeleting: bulkDelete.isPending,
  };
};