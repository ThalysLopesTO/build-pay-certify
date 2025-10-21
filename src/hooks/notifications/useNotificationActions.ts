
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useNotificationActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as unread",
        variant: "destructive",
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Notification dismissed",
        description: "The notification has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to dismiss notification",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('company_id', user.companyId)
        .eq('is_read', false)
        .eq('is_dismissed', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "All notifications marked as read",
        description: "All your notifications have been marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');

      const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true, updated_at: new Date().toISOString() })
        .eq('company_id', user.companyId)
        .eq('is_dismissed', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "All notifications cleared",
        description: "All your notifications have been dismissed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
    },
  });

  return {
    markAsRead: markAsReadMutation.mutate,
    markAsUnread: markAsUnreadMutation.mutate,
    dismiss: dismissMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    clearAllNotifications: clearAllNotificationsMutation.mutate,
    isLoading: markAsReadMutation.isPending || markAsUnreadMutation.isPending || 
               dismissMutation.isPending || markAllAsReadMutation.isPending ||
               clearAllNotificationsMutation.isPending,
  };
};
