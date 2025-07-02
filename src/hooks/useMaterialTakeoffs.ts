
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

      // Use raw SQL to query the new table until types are updated
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            mt.*,
            j.name as jobsite_name,
            j.address as jobsite_address
          FROM material_takeoffs mt
          LEFT JOIN jobsites j ON j.id = mt.jobsite_id
          WHERE mt.company_id = '${user.companyId}'
          ${jobsiteId ? `AND mt.jobsite_id = '${jobsiteId}'` : ''}
          ORDER BY mt.created_at DESC
        `
      });

      if (error) throw error;

      // Transform the raw data to match our interface
      return (data as any[])?.map((row: any) => ({
        id: row.id,
        jobsite_id: row.jobsite_id,
        company_id: row.company_id,
        material_name: row.material_name,
        unit: row.unit,
        total_qty_estimated: Number(row.total_qty_estimated),
        unit_price: Number(row.unit_price),
        subtotal: Number(row.subtotal),
        requested_qty: Number(row.requested_qty),
        remaining_qty: Number(row.remaining_qty),
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by: row.created_by,
        jobsites: {
          name: row.jobsite_name,
          address: row.jobsite_address
        }
      })) as MaterialTakeoff[] || [];
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
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO material_takeoffs (
            jobsite_id, company_id, material_name, unit, 
            total_qty_estimated, unit_price, created_by
          ) VALUES (
            '${takeoff.jobsite_id}', '${takeoff.company_id}', 
            '${takeoff.material_name}', '${takeoff.unit}', 
            ${takeoff.total_qty_estimated}, ${takeoff.unit_price}, 
            '${takeoff.created_by}'
          ) RETURNING *
        `
      });

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
      const setParts = Object.entries(updates)
        .filter(([key, value]) => value !== undefined && key !== 'id')
        .map(([key, value]) => `${key} = '${value}'`)
        .join(', ');

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE material_takeoffs 
          SET ${setParts}, updated_at = now()
          WHERE id = '${id}' AND company_id = '${user?.companyId}'
          RETURNING *
        `
      });

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
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          DELETE FROM material_takeoffs 
          WHERE id = '${id}' AND company_id = '${user?.companyId}'
        `
      });

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
