
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useWeeklyTimesheetActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveTimesheet = useMutation({
    mutationFn: async (timesheetId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('timesheets')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheetId)
        .select()
        .single();

      if (error) {
        console.error('Error approving timesheet:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast({
        title: "Success",
        description: "Timesheet approved successfully!",
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
    mutationFn: async (timesheetId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('timesheets')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', timesheetId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting timesheet:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast({
        title: "Success",
        description: "Timesheet rejected successfully!",
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
