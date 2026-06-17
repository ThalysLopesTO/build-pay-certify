import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Minus, X, ArrowLeft, Users } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useConversations } from '@/hooks/chat/useConversations';
import { ConversationSidebar } from './ConversationSidebar';
import { ConversationThread } from './ConversationThread';
import { UserAvatar } from './UserAvatar';

const CHAT_ROLES = ['admin', 'super_admin', 'foreman', 'management', 'employee'];

/**
 * Floating, global chat launcher. Lives in every role layout as a corner bubble
 * that expands into a Messenger-style panel. Auto-pops open when a new unread
 * message arrives, and can be minimized back to the bubble (keeping state) or
 * closed (returns to the conversation list). Works on desktop and mobile.
 */
const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { data: conversations = [] } = useConversations();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  // Auto-open the widget when a new unread message arrives while it's closed.
  const prevUnread = useRef(totalUnread);
  useEffect(() => {
    if (totalUnread > prevUnread.current && !open) setOpen(true);
    prevUnread.current = totalUnread;
  }, [totalUnread, open]);

  // Hide on the dedicated full-page chat route to avoid a double chat UI.
  const onChatPage = location.pathname.endsWith('/chat');

  if (!user || !CHAT_ROLES.includes(user.role || '') || onChatPage) return null;

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const isGroup = selected?.type === 'group';
  const other =
    selected && !isGroup ? selected.members.find((m) => m.user_id !== user.id) : null;
  const threadName = selected
    ? isGroup
      ? selected.name ?? 'Group Chat'
      : `${other?.profile?.first_name ?? ''} ${other?.profile?.last_name ?? ''}`.trim() ||
        'Unknown'
    : '';

  // ---- Collapsed: floating bubble ----
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:bottom-5 right-4 md:right-5 z-50 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-400/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="Open team chat"
      >
        <MessageSquare className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  // ---- Expanded: panel ----
  const panelClasses = isMobile
    ? 'fixed inset-0 z-50 flex flex-col bg-white'
    : 'fixed bottom-5 right-5 z-50 w-[380px] h-[600px] max-h-[calc(100vh-2.5rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden';

  return (
    <div className={panelClasses}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 text-white flex-shrink-0">
        {selected ? (
          <>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1 rounded-lg hover:bg-white/15 transition-colors flex-shrink-0"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {isGroup ? (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4" />
              </div>
            ) : (
              <UserAvatar profile={other?.profile} size="xs" />
            )}
            <span className="font-semibold text-sm truncate flex-1 min-w-0">{threadName}</span>
          </>
        ) : (
          <>
            <div className="p-1.5 rounded-lg bg-white/15 flex-shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm flex-1">Team Chat</span>
            {totalUnread > 0 && (
              <span className="text-[11px] font-semibold bg-white/20 rounded-full px-2 py-0.5">
                {totalUnread} new
              </span>
            )}
          </>
        )}

        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded-lg hover:bg-white/15 transition-colors flex-shrink-0"
          aria-label="Minimize chat"
          title="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setSelectedId(null);
          }}
          className="p-1 rounded-lg hover:bg-white/15 transition-colors flex-shrink-0"
          aria-label="Close chat"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0">
        {selected ? (
          <ConversationThread conversation={selected} embedded />
        ) : (
          <ConversationSidebar selectedId={selectedId} onSelect={setSelectedId} embedded />
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
