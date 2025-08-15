
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Notification } from './types';
import { useEffect } from 'react';

export const useNotifications = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['notifications', user?.id, user?.role],
    queryFn: async () => {
      if (!user?.id || !user?.companyId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', user.companyId)
        .in('user_role', user.role === 'super_admin' ? ['admin', 'foreman', 'management'] : [user.role])
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user?.id && !!user?.companyId && ['admin', 'super_admin', 'foreman', 'management'].includes(user?.role || ''),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Set up realtime subscription for notifications
  useEffect(() => {
    if (!user?.companyId || !['admin', 'super_admin', 'foreman', 'management'].includes(user?.role || '')) {
      return;
    }

    let unsubscribeRef: (() => void) | null = null;

    // Create unique channel name to avoid conflicts
    const channelName = `notifications-${user.companyId}-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${user.companyId}`,
        },
        (payload) => {
          console.log('Notification realtime update:', payload);
          // Refetch notifications when changes occur
          query.refetch();
        }
      )
      .subscribe((status) => {
        console.log('Notifications channel status:', channelName, status);
      });

    return () => {
      console.log('Cleaning up notifications channel:', channelName);
      supabase.removeChannel(channel);
    };
  }, [user?.companyId, user?.role, user?.id, query.refetch]);

  return query;
};
