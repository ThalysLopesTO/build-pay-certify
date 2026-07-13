import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useDeleteTimesheet = () => {
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
        .eq('company_id', user.companyId)
        .single();

      if (profileError) {
        throw new Error('Failed to verify user permissions');
      }

      if (!userProfile || !['admin', 'super_admin', 'management'].includes(userProfile.role)) {
        throw new Error('Insufficient permissions to delete timesheet records');
      }

      // Delete the timesheet record and verify it was actually removed
      const { data, error } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', timesheetId)
        .eq('company_id', user.companyId)
        .select('id');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Timesheet record was not deleted. You may not have permission to delete this record.');
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['live-punch-monitor'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['employee-hours-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['live-punch-data'] });
      
      toast({
        title: "Success",
        description: "Timesheet record has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Delete timesheet error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete timesheet record.",
        variant: "destructive",
      });
    },
  });
};