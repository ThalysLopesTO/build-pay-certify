import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface PunchEditData {
  check_in_time?: string;
  check_out_time?: string;
  jobsite_id?: string;
  break_minutes?: number | null;
  work_note?: string | null;
}

export const usePunchEdit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PunchEditData }) => {
      console.log('Updating punch record:', { company_id: user?.companyId, id }, data);

      const { data: result, error } = await supabase
        .from('timesheets')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('company_id', user?.companyId)
        .select()
        .single();

      if (error) {
        console.error('Punch update error:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('Punch record updated successfully:', data);
      toast({
        title: "Punch Record Updated",
        description: "The punch record has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['live-punch-data'] });
      queryClient.invalidateQueries({ queryKey: ['employee-hours-breakdown'] });
    },
    onError: (error) => {
      console.error('Failed to update punch record:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update punch record. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Bulk update hook - updates multiple punch records via Promise.allSettled
export const useBulkPunchEdit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; data: PunchEditData }[]) => {
      if (!user?.companyId) throw new Error('No company ID');

      const results = await Promise.allSettled(
        updates.map(async ({ id, data }) => {
          const { data: result, error } = await supabase
            .from('timesheets')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('company_id', user.companyId)
            .select()
            .single();

          if (error) throw { id, error };
          return { id, result };
        })
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason);

      return { succeeded, failed, total: updates.length };
    },
    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: ['live-punch-monitor'] });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['live-punch-data'] });

      if (failed.length === 0) {
        toast({
          title: "Bulk Update Complete",
          description: `${succeeded} punch record${succeeded !== 1 ? 's' : ''} updated successfully`,
        });
      } else {
        toast({
          title: "Partial Update",
          description: `${succeeded} of ${total} records updated. ${failed.length} failed.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Bulk update failed:', error);
      toast({
        title: "Bulk Update Failed",
        description: "Failed to update punch records. Please try again.",
        variant: "destructive",
      });
    },
  });
};
