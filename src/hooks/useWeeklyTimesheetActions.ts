
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

      console.log('Approving weekly timesheet:', timesheetId);
      
      const { data, error } = await supabase
        .from('weekly_timesheets')
        .update({ status: 'approved' })
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
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
    mutationFn: async (timesheetId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Rejecting weekly timesheet:', timesheetId);
      
      const { data, error } = await supabase
        .from('weekly_timesheets')
        .update({ status: 'rejected' })
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
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

  const editTimesheet = useMutation({
    mutationFn: async ({ timesheetId, updates }: { timesheetId: string; updates: any }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Editing weekly timesheet:', timesheetId, updates);
      
      const { data, error } = await supabase
        .from('weekly_timesheets')
        .update(updates)
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .select()
        .single();

      if (error) {
        console.error('Error editing timesheet:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast({
        title: "Success",
        description: "Weekly timesheet updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Edit timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    approveTimesheet: approveTimesheet.mutate,
    rejectTimesheet: rejectTimesheet.mutate,
    editTimesheet: editTimesheet.mutate,
    isApproving: approveTimesheet.isPending,
    isRejecting: rejectTimesheet.isPending,
    isEditing: editTimesheet.isPending,
  };
};
