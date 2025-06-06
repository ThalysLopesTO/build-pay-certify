
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useTimesheetRejection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timesheetId: string) => {
      console.log('Rejecting timesheet:', timesheetId);

      const { data: result, error } = await supabase
        .from('weekly_timesheets')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheetId)
        .eq('company_id', user?.companyId) // Ensure user can only reject their company's timesheets
        .select()
        .single();

      if (error) {
        console.error('Timesheet rejection error:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('Timesheet rejected successfully:', data);
      toast({
        title: "Timesheet Rejected",
        description: "The timesheet has been rejected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
    },
    onError: (error) => {
      console.error('Failed to reject timesheet:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });
};
