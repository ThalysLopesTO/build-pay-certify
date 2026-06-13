import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  ConversationWithDetails,
  ChatMemberWithProfile,
  ChatMessage,
  ChatUserProfile,
} from '@/components/chat/types';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-conversations', user?.id],
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      if (!user?.id || !user?.companyId) return [];

      // 1. Get conversation IDs + last_read_at for this user
      const { data: myMemberships, error: memErr } = await supabase
        .from('chat_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (memErr) throw memErr;
      if (!myMemberships?.length) return [];

      const convIds = myMemberships.map(m => m.conversation_id);
      const lastReadMap: Record<string, string> = Object.fromEntries(
        myMemberships.map(m => [m.conversation_id, m.last_read_at])
      );

      // 2. Fetch conversation rows
      const { data: conversations, error: convErr } = await supabase
        .from('chat_conversations')
        .select('*')
        .in('id', convIds)
        .eq('company_id', user.companyId)
        .order('updated_at', { ascending: false });

      if (convErr) throw convErr;
      if (!conversations?.length) return [];

      // 3. Fetch all members for these conversations
      const { data: allMembers, error: allMemErr } = await supabase
        .from('chat_members')
        .select('*')
        .in('conversation_id', convIds);

      if (allMemErr) throw allMemErr;

      // 4. Fetch profiles for all member user_ids
      const memberUserIds = [...new Set((allMembers ?? []).map(m => m.user_id))];
      const { data: profiles, error: profErr } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, role, photo_url')
        .in('user_id', memberUserIds);

      if (profErr) throw profErr;
      const profileMap: Record<string, ChatUserProfile> = Object.fromEntries(
        (profiles ?? []).map(p => [p.user_id, p as ChatUserProfile])
      );

      // 5. Fetch last message for each conversation (parallel)
      const lastMsgResults = await Promise.all(
        convIds.map(async (convId) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', convId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          return {
            convId,
            message: data
              ? ({ ...data, sender: profileMap[data.sender_id] } as ChatMessage)
              : null,
          };
        })
      );
      const lastMessageMap: Record<string, ChatMessage | null> = Object.fromEntries(
        lastMsgResults.map(r => [r.convId, r.message])
      );

      // 6. Fetch unread messages counts (single query, filter in JS)
      const { data: recentMsgs } = await supabase
        .from('chat_messages')
        .select('conversation_id, created_at, sender_id')
        .in('conversation_id', convIds)
        .eq('is_deleted', false)
        .neq('sender_id', user.id);

      const unreadCountMap: Record<string, number> = {};
      for (const convId of convIds) {
        const lastRead = new Date(lastReadMap[convId]);
        unreadCountMap[convId] = (recentMsgs ?? []).filter(
          m => m.conversation_id === convId && new Date(m.created_at) > lastRead
        ).length;
      }

      // 7. Assemble
      return conversations.map(conv => ({
        ...conv,
        type: conv.type as 'direct' | 'group',
        members: (allMembers ?? [])
          .filter(m => m.conversation_id === conv.id && profileMap[m.user_id])
          .map(m => ({ ...m, profile: profileMap[m.user_id] })) as ChatMemberWithProfile[],
        last_message: lastMessageMap[conv.id] ?? null,
        unread_count: unreadCountMap[conv.id] ?? 0,
      }));
    },
    enabled: !!user?.id && !!user?.companyId,
    staleTime: 20 * 1000,
  });

  // Real-time: refresh conversation list when new messages or conversations appear
  useEffect(() => {
    if (!user?.id || !user?.companyId) return;

    const channel = supabase
      .channel(`chat-list-${user.id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat-conversations', user.id] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat-conversations', user.id] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat-conversations', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, user?.companyId, queryClient]);

  return query;
};
