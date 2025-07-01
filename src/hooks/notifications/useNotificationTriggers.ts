
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useNotificationTriggers = () => {
  const queryClient = useQueryClient();

  const checkExpiringCertificates = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('check_expiring_certificates');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Certificate Check Complete",
        description: "Checked for expiring certificates and created notifications if needed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to check expiring certificates",
        variant: "destructive",
      });
    },
  });

  const checkOverdueJobsites = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('check_overdue_jobsites');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Jobsite Check Complete",
        description: "Checked for overdue jobsites and created notifications if needed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to check overdue jobsites",
        variant: "destructive",
      });
    },
  });

  const cleanupOldNotifications = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('cleanup_old_notifications');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Cleanup Complete",
        description: "Old notifications have been cleaned up",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cleanup old notifications",
        variant: "destructive",
      });
    },
  });

  return {
    checkExpiringCertificates: checkExpiringCertificates.mutate,
    checkOverdueJobsites: checkOverdueJobsites.mutate,
    cleanupOldNotifications: cleanupOldNotifications.mutate,
    isLoading: checkExpiringCertificates.isPending || 
               checkOverdueJobsites.isPending || 
               cleanupOldNotifications.isPending,
  };
};
