
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Notification } from './types';

export const useNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, user?.role],
    queryFn: async () => {
      if (!user?.id || !user?.companyId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', user.companyId)
        .in('user_role', user.role === 'super_admin' ? ['admin', 'foreman'] : [user.role])
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user?.id && !!user?.companyId && ['admin', 'super_admin', 'foreman'].includes(user?.role || ''),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};
