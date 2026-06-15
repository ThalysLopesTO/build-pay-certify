import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ChatMessage, ChatUserProfile } from '@/components/chat/types';
import { toast } from '@/hooks/use-toast';

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!conversationId || !user?.id) return [];

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      if (!messages?.length) return [];

      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, role, photo_url')
        .in('user_id', senderIds);

      const profileMap: Record<string, ChatUserProfile> = Object.fromEntries(
        (profiles ?? []).map(p => [p.user_id, p as ChatUserProfile])
      );

      return messages.map(m => ({
        ...m,
        is_deleted: m.is_deleted ?? false,
        attachment_url: m.attachment_url ?? null,
        sender: profileMap[m.sender_id],
      }));
    },
    enabled: !!conversationId && !!user?.id,
    staleTime: 0,
  });

  // Mark conversation as read when opened
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    supabase
      .from('chat_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['chat-conversations', user.id] });
      });
  }, [conversationId, user?.id, queryClient]);

  // Real-time: append new messages instantly
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channel = supabase
      .channel(`chat-msg-${conversationId}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const newMsg: ChatMessage = {
            id: raw.id as string,
            conversation_id: raw.conversation_id as string,
            sender_id: raw.sender_id as string,
            content: raw.content as string,
            created_at: raw.created_at as string,
            is_deleted: (raw.is_deleted as boolean) ?? false,
            attachment_url: (raw.attachment_url as string) ?? null,
          };

          // Enrich with sender profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, role, photo_url')
            .eq('user_id', newMsg.sender_id)
            .maybeSingle();

          const enriched: ChatMessage = { ...newMsg, sender: profile as ChatUserProfile | undefined };

          queryClient.setQueryData<ChatMessage[]>(['chat-messages', conversationId], old => {
            if (!old) return [enriched];
            if (old.some(m => m.id === enriched.id)) return old;
            return [...old, enriched];
          });

          // Mark as read immediately if it's from someone else
          if (newMsg.sender_id !== user.id) {
            supabase
              .from('chat_members')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', user.id);
          }

          queryClient.invalidateQueries({ queryKey: ['chat-conversations', user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user?.id, queryClient]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !user?.id || !content.trim()) return;

    // Client-generated id so we can show the message immediately and let the
    // realtime handler dedupe against it (it checks m.id). This makes sent
    // messages appear instantly even if realtime delivery is delayed/unavailable.
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimistic: ChatMessage = {
      id,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      attachment_url: null,
      sender: {
        user_id: user.id,
        first_name: user.firstName ?? null,
        last_name: user.lastName ?? null,
        role: user.role ?? '',
        photo_url: user.photo_url ?? null,
      },
    };

    queryClient.setQueryData<ChatMessage[]>(['chat-messages', conversationId], old => {
      if (old?.some(m => m.id === id)) return old;
      return [...(old ?? []), optimistic];
    });

    const { error } = await supabase.from('chat_messages').insert({
      id,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    });

    if (error) {
      // Roll back the optimistic message on failure.
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', conversationId], old =>
        old?.filter(m => m.id !== id),
      );
      toast({ title: 'Failed to send message', variant: 'destructive' });
      throw error;
    }

    // Refresh the conversation list (ordering / last message / unread).
    queryClient.invalidateQueries({ queryKey: ['chat-conversations', user.id] });
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
      .eq('sender_id', user?.id ?? '');

    if (error) {
      toast({ title: 'Failed to delete message', variant: 'destructive' });
    } else {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', conversationId], old =>
        old?.map(m => (m.id === messageId ? { ...m, is_deleted: true } : m))
      );
    }
  };

  return { ...query, sendMessage, deleteMessage };
};
