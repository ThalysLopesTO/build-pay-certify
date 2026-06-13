import React, { useEffect, useRef } from 'react';
import { isSameDay } from 'date-fns';
import { ArrowLeft, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useMessages } from '@/hooks/chat/useMessages';
import { ConversationWithDetails } from './types';
import { MessageBubble, DateSeparator } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { UserAvatar } from './UserAvatar';

interface Props {
  conversation: ConversationWithDetails;
  onBack?: () => void;
  /** When rendered inside the floating ChatWidget, the widget supplies its own
   *  title bar, so the thread hides its internal header. */
  embedded?: boolean;
}

export const ConversationThread: React.FC<Props> = ({ conversation, onBack, embedded = false }) => {
  const { user } = useAuth();
  const { data: messages = [], isLoading, sendMessage, deleteMessage } = useMessages(conversation.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation.type === 'group';

  const other = !isGroup
    ? conversation.members.find(m => m.user_id !== user?.id)
    : null;

  const displayName = isGroup
    ? conversation.name ?? 'Group Chat'
    : `${other?.profile?.first_name ?? ''} ${other?.profile?.last_name ?? ''}`.trim() || 'Unknown';

  const subLabel = isGroup
    ? `${conversation.members.length} member${conversation.members.length !== 1 ? 's' : ''}`
    : other?.profile?.role?.replace(/_/g, ' ') ?? '';

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Render messages with date separators and consecutive grouping
  const renderMessages = () => {
    const nodes: React.ReactNode[] = [];
    let prevDate: Date | null = null;
    let prevSender: string | null = null;

    messages.forEach((msg, i) => {
      const msgDate = new Date(msg.created_at);
      const nextMsg = messages[i + 1];

      // Date separator
      if (!prevDate || !isSameDay(prevDate, msgDate)) {
        nodes.push(<DateSeparator key={`sep-${msg.id}`} date={msg.created_at} />);
        prevDate = msgDate;
        prevSender = null;
      }

      const isOwn = msg.sender_id === user?.id;
      const isLastInGroup =
        !nextMsg || nextMsg.sender_id !== msg.sender_id;
      const showAvatar = !isOwn && isLastInGroup;
      const showName = !isOwn && prevSender !== msg.sender_id;

      nodes.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={isOwn}
          showAvatar={showAvatar}
          showSenderName={showName}
          isGroup={isGroup}
          onDelete={isOwn ? deleteMessage : undefined}
        />
      );

      prevSender = msg.sender_id;
    });

    return nodes;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80">
      {/* Header */}
      {!embedded && (
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 mr-0.5"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {isGroup ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
        ) : (
          <UserAvatar profile={other?.profile} size="md" showOnline={false} />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{displayName}</p>
          <p className="text-xs text-slate-500 capitalize leading-tight">{subLabel}</p>
        </div>

        {isGroup && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 3 === 2 ? 'justify-end' : 'justify-start'}`}
              >
                {i % 3 !== 2 && <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse mr-2 flex-shrink-0 self-end" />}
                <div
                  className="h-10 rounded-2xl bg-slate-200 animate-pulse"
                  style={{ width: `${30 + (i % 3) * 15}%` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-5 rounded-2xl bg-indigo-50 mb-4 shadow-sm">
              {isGroup ? (
                <Users className="h-9 w-9 text-indigo-400" />
              ) : (
                <UserAvatar profile={other?.profile} size="lg" />
              )}
            </div>
            <p className="text-base font-semibold text-slate-700">{displayName}</p>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xs">
              {isGroup
                ? `Kick off the conversation for ${displayName}!`
                : `Say hi to ${other?.profile?.first_name ?? 'your teammate'}! 👋`}
            </p>
          </div>
        ) : (
          <>
            {renderMessages()}
            <div ref={bottomRef} className="h-2" />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </div>
  );
};
