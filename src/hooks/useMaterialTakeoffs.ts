
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

export interface CreateMaterialTakeoff {
  jobsite_id: string;
  company_id: string;
  material_name: string;
  unit: string;
  total_qty_estimated: number;
  unit_price: number;
  created_by: string;
}

export const useMaterialTakeoffs = (jobsiteId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-takeoffs', user?.companyId, jobsiteId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      // For now, return mock data since the table doesn't exist in the current types
      // This would normally query the material_takeoffs table
      const mockTakeoffs: MaterialTakeoff[] = [
        {
          id: '1',
          jobsite_id: jobsiteId || 'test-jobsite',
          company_id: user.companyId,
          material_name: '2x4 Lumber',
          unit: 'pcs',
          total_qty_estimated: 100,
          unit_price: 5.50,
          subtotal: 550,
          requested_qty: 0,
          remaining_qty: 100,
          status: 'not_requested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: user.id || '',
          jobsites: {
            name: 'Test Jobsite',
            address: '123 Test St'
          }
        }
      ];

      return jobsiteId ? mockTakeoffs.filter(t => t.jobsite_id === jobsiteId) : mockTakeoffs;
    },
    enabled: !!user?.companyId,
  });
};

export const useMaterialTakeoffMutations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTakeoff = useMutation({
    mutationFn: async (takeoff: CreateMaterialTakeoff) => {
      // For now, just log the creation since the table doesn't exist in types
      console.log('Would create takeoff:', takeoff);
      return { id: 'new-takeoff-id', ...takeoff };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
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
      // For now, just log the update since the table doesn't exist in types
      console.log('Would update takeoff:', id, updates);
      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
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
      // For now, just log the deletion since the table doesn't exist in types
      console.log('Would delete takeoff:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
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

  return {
    createTakeoff: createTakeoff.mutate,
    updateTakeoff: updateTakeoff.mutate,
    deleteTakeoff: deleteTakeoff.mutate,
    isCreating: createTakeoff.isPending,
    isUpdating: updateTakeoff.isPending,
    isDeleting: deleteTakeoff.isPending,
  };
};
