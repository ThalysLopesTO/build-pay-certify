import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface UpdateTimesheetParams {
  timesheetId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  breakMinutes?: number | null;
  adminNote?: string;
}

export const useUpdateTimesheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ timesheetId, checkInTime, checkOutTime, breakMinutes, adminNote }: UpdateTimesheetParams) => {
      console.log('Updating timesheet:', { timesheetId, checkInTime, checkOutTime, breakMinutes, adminNote });
      
      const { data, error } = await supabase
        .from('timesheets')
        .update({
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          break_minutes: breakMinutes,
          admin_note: adminNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheetId)
        .select();

      console.log('Update result:', { data, error });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate time summary details only - time-summary is handled by real-time subscription
      queryClient.invalidateQueries({ queryKey: ['timeSummaryDetails'] });
      
      toast({
        title: "Time Updated",
        description: "The time entry has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating timesheet:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update time entry. Please try again.",
        variant: "destructive",
      });
    },
  });
};
