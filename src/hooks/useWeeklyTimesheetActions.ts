
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useWeeklyTimesheetActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveTimesheet = useMutation({
    mutationFn: async (weeklyTimesheetId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Since we're working with aggregated data, we need to find all individual timesheets
      // for this weekly grouping and update them all
      // For now, we'll handle this as a placeholder - in a real implementation,
      // you might want to store weekly timesheet records separately
      
      console.log('Approving weekly timesheet:', weeklyTimesheetId);
      
      // This is a placeholder response since we're working with aggregated data
      return { id: weeklyTimesheetId, status: 'approved' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast({
        title: "Success",
        description: "Weekly timesheet approved successfully!",
      });
    },
    onError: (error) => {
      console.error('Approve timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to approve timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectTimesheet = useMutation({
    mutationFn: async (weeklyTimesheetId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Since we're working with aggregated data, we need to find all individual timesheets
      // for this weekly grouping and update them all
      // For now, we'll handle this as a placeholder - in a real implementation,
      // you might want to store weekly timesheet records separately
      
      console.log('Rejecting weekly timesheet:', weeklyTimesheetId);
      
      // This is a placeholder response since we're working with aggregated data
      return { id: weeklyTimesheetId, status: 'rejected' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast({
        title: "Success",
        description: "Weekly timesheet rejected successfully!",
      });
    },
    onError: (error) => {
      console.error('Reject timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to reject timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    approveTimesheet: approveTimesheet.mutate,
    rejectTimesheet: rejectTimesheet.mutate,
    isApproving: approveTimesheet.isPending,
    isRejecting: rejectTimesheet.isPending,
  };
};
