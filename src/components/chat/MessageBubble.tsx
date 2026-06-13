import React from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ChatMessage } from './types';
import { UserAvatar } from './UserAvatar';
import { Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  isGroup: boolean;
  onDelete?: (id: string) => void;
}

function fmtTime(iso: string) {
  return format(new Date(iso), 'h:mm a');
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  isGroup,
  onDelete,
}) => {
  if (message.is_deleted) {
    return (
      <div className={`flex mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <p className="text-xs text-slate-400 italic px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
          Message deleted
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 mb-0.5 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar column — fixed width so bubbles align */}
      <div className="w-8 flex-shrink-0 self-end">
        {!isOwn && showAvatar ? (
          <UserAvatar profile={message.sender} size="sm" />
        ) : null}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[72%] sm:max-w-[58%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name in groups */}
        {!isOwn && showSenderName && isGroup && (
          <p className="text-[11px] font-semibold text-slate-400 mb-1 px-1">
            {message.sender?.first_name} {message.sender?.last_name}
          </p>
        )}

        <div className="relative">
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
              isOwn
                ? 'bg-indigo-600 text-white rounded-br-md shadow-md shadow-indigo-100'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
            }`}
          >
            {message.content}
          </div>

          {/* Delete button on hover (own messages only) */}
          {isOwn && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all"
              title="Delete message"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-0.5 px-1">{fmtTime(message.created_at)}</p>
      </div>
    </div>
  );
};

export const DateSeparator: React.FC<{ date: string }> = ({ date }) => {
  const d = new Date(date);
  const label = isToday(d)
    ? 'Today'
    : isYesterday(d)
    ? 'Yesterday'
    : format(d, 'MMMM d, yyyy');

  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-semibold text-slate-400 px-2 flex-shrink-0 bg-slate-50 rounded-full border border-slate-200 py-0.5">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
};

export { isSameDay };
