
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
  created_at: string;
  updated_at: string;
  created_by: string;
  jobsites?: {
    name: string;
    address: string;
  };
}

export const useMaterialTakeoffs = (jobsiteId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-takeoffs', user?.companyId, jobsiteId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      let query = supabase
        .from('material_takeoffs')
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (jobsiteId) {
        query = query.eq('jobsite_id', jobsiteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MaterialTakeoff[];
    },
    enabled: !!user?.companyId,
  });
};

export const useMaterialTakeoffMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTakeoff = useMutation({
    mutationFn: async (takeoff: Omit<MaterialTakeoff, 'id' | 'created_at' | 'updated_at' | 'subtotal' | 'requested_qty' | 'remaining_qty' | 'status'>) => {
      const { data, error } = await supabase
        .from('material_takeoffs')
        .insert({
          ...takeoff,
          company_id: user?.companyId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
      toast({
        title: 'Success',
        description: 'Material takeoff item created successfully',
      });
    },
    onError: (error) => {
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
        .eq('company_id', user?.companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
      toast({
        title: 'Success',
        description: 'Material takeoff item updated successfully',
      });
    },
    onError: (error) => {
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
        .eq('id', id)
        .eq('company_id', user?.companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
      toast({
        title: 'Success',
        description: 'Material takeoff item deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete material takeoff item',
        variant: 'destructive',
      });
    },
  });

  return {
    createTakeoff: createTakeoff.mutate,
    updateTakeoff: updateTakeoff.mutate,
    deleteTakeoff: deleteTakeoff.mutate,
    isCreating: createTakeoff.isPending,
    isUpdating: updateTakeoff.isPending,
    isDeleting: deleteTakeoff.isPending,
  };
};
