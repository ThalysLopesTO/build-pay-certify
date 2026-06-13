import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ChatUserProfile } from '@/components/chat/types';

export const useChatUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-users', user?.companyId],
    queryFn: async (): Promise<ChatUserProfile[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, role, photo_url')
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .neq('user_id', user.id)
        .order('first_name');

      if (error) throw error;
      return (data ?? []) as ChatUserProfile[];
    },
    enabled: !!user?.companyId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};
