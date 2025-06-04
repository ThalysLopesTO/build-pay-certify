
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useTimesheetApproval = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timesheetId: string) => {
      console.log('Approving timesheet:', timesheetId);

      const { data: result, error } = await supabase
        .from('weekly_timesheets')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheetId)
        .eq('company_id', user?.companyId) // Ensure user can only approve their company's timesheets
        .select()
        .single();

      if (error) {
        console.error('Timesheet approval error:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('Timesheet approved successfully:', data);
      toast({
        title: "Timesheet Approved",
        description: "The timesheet has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
    },
    onError: (error) => {
      console.error('Failed to approve timesheet:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });
};
