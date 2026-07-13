import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useDailyReportDelete = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reportId: string) => {
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
        throw new Error('Insufficient permissions to delete daily reports');
      }

      // Delete the daily report
      const { error } = await supabase
        .from('daily_reports')
        .delete()
        .eq('id', reportId)
        .eq('company_id', user.companyId);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      
      toast({
        title: "Success",
        description: "Daily report has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Delete daily report error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete daily report.",
        variant: "destructive",
      });
    },
  });
};