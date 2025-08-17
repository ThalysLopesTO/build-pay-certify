import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useDeleteWeeklyTimesheet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (timesheetId: string) => {
      if (!user?.companyId) {
        throw new Error('Company ID not found');
      }

      // Verify user has admin permissions
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to verify user permissions');
      }

      if (!userProfile || !['admin', 'super_admin', 'management'].includes(userProfile.role)) {
        throw new Error('Insufficient permissions to delete timesheet records');
      }

      // Get the timesheet data before deletion for audit logging
      const { data: timesheetData, error: fetchError } = await supabase
        .from('weekly_timesheets')
        .select('*')
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .single();

      if (fetchError || !timesheetData) {
        throw new Error('Timesheet not found or access denied');
      }

      // Log the deletion to audit table
      const { error: auditError } = await supabase
        .from('weekly_timesheet_audit_logs')
        .insert({
          timesheet_id: timesheetId,
          action: 'DELETE',
          original_data: timesheetData,
          changes: { deleted: true, deleted_at: new Date().toISOString() },
          edited_by: user.id,
          company_id: user.companyId,
          notes: `Timesheet deleted by ${userProfile.role}`
        });

      if (auditError) {
        console.error('Failed to log audit entry:', auditError);
        // Continue with deletion even if audit logging fails
      }

      // Delete the timesheet record
      const { error } = await supabase
        .from('weekly_timesheets')
        .delete()
        .eq('id', timesheetId)
        .eq('company_id', user.companyId);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
      
      toast({
        title: "Success",
        description: "Timesheet record has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Delete weekly timesheet error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete timesheet record.",
        variant: "destructive",
      });
    },
  });
};