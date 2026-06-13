import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Notification } from './types';
import { useEffect, useRef } from 'react';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Stable channel name — created once per user session, not on every render
  const channelName = useRef(`notifications-${user?.companyId ?? 'anon'}-${user?.id ?? 'anon'}`);

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
    enabled:
      !!user?.id &&
      !!user?.companyId &&
      ['admin', 'super_admin', 'foreman', 'management'].includes(user?.role || ''),
    staleTime: 30 * 1000,
  });

  // Realtime subscription — stable channel, invalidates query on any change
  useEffect(() => {
    if (
      !user?.companyId ||
      !['admin', 'super_admin', 'foreman', 'management'].includes(user?.role || '')
    ) {
      return;
    }

    const name = channelName.current;

    const channel = supabase
      .channel(name)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${user.companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id, user.role] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId, user?.role, user?.id]);

  return query;
};
