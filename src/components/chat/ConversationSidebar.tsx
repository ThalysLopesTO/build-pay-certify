import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, Search, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations } from '@/hooks/chat/useConversations';
import { ConversationItem } from './ConversationItem';
import { NewConversationDialog } from './NewConversationDialog';
import { UserAvatar } from './UserAvatar';
import { ChatUserProfile } from './types';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ConversationSidebar: React.FC<Props> = ({ selectedId, onSelect }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading } = useConversations();
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  const filtered = search
    ? conversations.filter(c => {
        const q = search.toLowerCase();
        if (c.name?.toLowerCase().includes(q)) return true;
        return c.members.some(m =>
          `${m.profile?.first_name ?? ''} ${m.profile?.last_name ?? ''}`.toLowerCase().includes(q)
        );
      })
    : conversations;

  const directs = filtered.filter(c => c.type === 'direct');
  const groups  = filtered.filter(c => c.type === 'group');

  const myProfile: ChatUserProfile | undefined = user
    ? {
        user_id:    user.id,
        first_name: user.firstName ?? null,
        last_name:  user.lastName  ?? null,
        role:       user.role      ?? '',
        photo_url:  user.photo_url ?? null,
      }
    : undefined;

  const handleCreated = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['chat-conversations', user?.id] });
    onSelect(id);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-100">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Team Chat</h2>
              {totalUnread > 0 && (
                <p className="text-[10px] text-indigo-600 font-semibold">
                  {totalUnread} unread {totalUnread === 1 ? 'message' : 'messages'}
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setNewChatOpen(true)}
            className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md shadow-indigo-200"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:border-indigo-300"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-[60px] rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 && !search ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="p-4 rounded-2xl bg-indigo-50 mb-3">
              <MessageCircle className="h-8 w-8 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No conversations yet</p>
            <p className="text-xs text-slate-400 mt-1">Start chatting with your team</p>
            <Button
              size="sm"
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
              onClick={() => setNewChatOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />New Chat
            </Button>
          </div>
        ) : (
          <>
            {directs.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1.5">
                  Direct Messages
                </p>
                {directs.map(c => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={selectedId === c.id}
                    onClick={() => onSelect(c.id)}
                  />
                ))}
              </section>
            )}
            {groups.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1.5">
                  Group Chats
                </p>
                {groups.map(c => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={selectedId === c.id}
                    onClick={() => onSelect(c.id)}
                  />
                ))}
              </section>
            )}
            {filtered.length === 0 && search && (
              <p className="text-center text-sm text-slate-400 py-8">No results for "{search}"</p>
            )}
          </>
        )}
      </div>

      {/* Footer — current user */}
      <div className="px-3 py-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <UserAvatar profile={myProfile} size="sm" />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">
              {user?.role?.replace('_', ' ')} · Online
            </p>
          </div>
        </div>
      </div>

      <NewConversationDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onConversationCreated={handleCreated}
      />
    </div>
  );
};
