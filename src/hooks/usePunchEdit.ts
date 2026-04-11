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
        .eq('company_id', user?.companyId) // Ensure user can only update their company's timesheets
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