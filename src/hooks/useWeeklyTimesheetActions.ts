
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

      console.log('Updating weekly timesheet approval:', timesheetId);
      
      // Get current timesheet to determine the new status
      const { data: currentTimesheet, error: fetchError } = await supabase
        .from('weekly_timesheets')
        .select('status')
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .single();

      if (fetchError) {
        console.error('Error fetching timesheet:', fetchError);
        throw fetchError;
      }

      // If already approved, revert to pending; otherwise approve
      const newStatus = currentTimesheet.status === 'approved' ? 'pending' : 'approved';
      
      const { data, error } = await supabase
        .from('weekly_timesheets')
        .update({ 
          status: newStatus,
          updated_by: user.id 
        })
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating timesheet approval:', error);
        throw error;
      }

      return { data, newStatus };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      const action = result.newStatus === 'approved' ? 'approved' : 'reverted to pending';
      toast({
        title: "Success",
        description: `Weekly timesheet ${action} successfully!`,
      });
    },
    onError: (error) => {
      console.error('Approve timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet approval. Please try again.",
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
      
      // Get current timesheet to determine the new status
      const { data: currentTimesheet, error: fetchError } = await supabase
        .from('weekly_timesheets')
        .select('status')
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .single();

      if (fetchError) {
        console.error('Error fetching timesheet:', fetchError);
        throw fetchError;
      }

      // If already rejected, revert to pending; otherwise reject
      const newStatus = currentTimesheet.status === 'rejected' ? 'pending' : 'rejected';
      
      const { data, error } = await supabase
        .from('weekly_timesheets')
        .update({ 
          status: newStatus,
          updated_by: user.id 
        })
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating timesheet status:', error);
        throw error;
      }

      return { data, newStatus };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      const action = result.newStatus === 'rejected' ? 'rejected' : 'reverted to pending';
      toast({
        title: "Success",
        description: `Weekly timesheet ${action} successfully!`,
      });
    },
    onError: (error) => {
      console.error('Reject timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editTimesheet = useMutation({
    mutationFn: async ({ timesheetId, updates, originalData }: { 
      timesheetId: string; 
      updates: any;
      originalData: any;
    }) => {
      console.log('🔍 Weekly timesheet edit attempt:', {
        userId: user?.id,
        userRole: user?.role,
        companyId: user?.companyId,
        timesheetId,
        updates
      });

      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated');
      }

      // Permission check - only admin, super_admin, management, and foreman can edit timesheets
      if (!user.role || !['admin', 'super_admin', 'management', 'foreman'].includes(user.role)) {
        throw new Error('You do not have permission to edit timesheets');
      }

      console.log('📝 Editing weekly timesheet with verified permissions');
      
      // Filter out generated columns before update
      const { total_hours, gross_pay, ...updateData } = updates;
      
      // Update the timesheet with enhanced error handling
      const { data, error } = await supabase
        .from('weekly_timesheets')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Error editing timesheet:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to update timesheet - no data returned or access denied');
      }

      console.log('✅ Weekly timesheet updated successfully:', data);

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
