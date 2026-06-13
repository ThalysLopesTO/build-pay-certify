import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Notification } from './types';
import { useEffect } from 'react';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (
      !user?.companyId ||
      !user?.id ||
      !['admin', 'super_admin', 'foreman', 'management'].includes(user?.role || '')
    ) {
      return;
    }

    const companyId = user.companyId;
    const userId = user.id;
    const role = user.role;

    // Unique name per effect invocation — prevents "subscribe called twice" when
    // TOKEN_REFRESHED fires and re-runs this effect before removeChannel completes.
    const name = `notif-${companyId}-${userId}-${Date.now()}`;

    const channel = supabase
      .channel(name)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId, role] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.companyId, user?.role, user?.id, queryClient]);

  return query;
};
