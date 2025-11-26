import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface UpdateTimesheetParams {
  timesheetId: string;
  checkInTime: string;
  checkOutTime: string;
  adminNote?: string;
}

export const useUpdateTimesheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ timesheetId, checkInTime, checkOutTime, adminNote }: UpdateTimesheetParams) => {
      const { error } = await supabase
        .from('timesheets')
        .update({
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          admin_note: adminNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheetId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all time summary queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['timeSummaryDetails'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      
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
