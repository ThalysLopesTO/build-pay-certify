import React from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Users } from 'lucide-react';
import { ConversationWithDetails } from './types';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface Props {
  conversation: ConversationWithDetails;
  isActive: boolean;
  onClick: () => void;
}

const ROLE_COLOR: Record<string, string> = {
  admin:       'text-indigo-600',
  super_admin: 'text-purple-600',
  foreman:     'text-amber-600',
  management:  'text-blue-600',
  employee:    'text-slate-500',
};

export const ConversationItem: React.FC<Props> = ({ conversation, isActive, onClick }) => {
  const { user } = useAuth();
  const isDM = conversation.type === 'direct';

  const other = isDM
    ? conversation.members.find(m => m.user_id !== user?.id)
    : null;

  const displayName = isDM
    ? `${other?.profile?.first_name ?? ''} ${other?.profile?.last_name ?? ''}`.trim() || 'Unknown'
    : conversation.name ?? 'Group Chat';

  const lastMsg = conversation.last_message;
  const preview = lastMsg?.content ?? 'No messages yet';
  const timeStr = lastMsg?.created_at
    ? formatDistanceToNowStrict(new Date(lastMsg.created_at), { addSuffix: false })
    : null;

  const unread = conversation.unread_count;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-100 ${
        isActive
          ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
          : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isDM ? (
          <UserAvatar profile={other?.profile} size="md" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
        )}
        {isActive && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
            {displayName}
          </p>
          {timeStr && (
            <span className={`text-[10px] flex-shrink-0 tabular-nums ${unread > 0 ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
              {timeStr}
            </span>
          )}
        </div>

        {/* Role label for DMs */}
        {isDM && other?.profile?.role && (
          <p className={`text-[10px] font-medium capitalize mb-0.5 ${ROLE_COLOR[other.profile.role] ?? 'text-slate-500'}`}>
            {other.profile.role.replace('_', ' ')}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate ${unread > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
            {!isDM && lastMsg?.sender && (
              <span className="font-semibold">{lastMsg.sender.first_name}: </span>
            )}
            {preview}
          </p>
          {unread > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
