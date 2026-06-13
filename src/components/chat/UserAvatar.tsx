import React from 'react';
import { ChatUserProfile } from './types';

interface UserAvatarProps {
  profile?: ChatUserProfile | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showOnline?: boolean;
  className?: string;
}

const sizes = {
  xs: { wrap: 'w-6 h-6',   text: 'text-[9px]',  dot: 'w-1.5 h-1.5 -bottom-0 -right-0 border' },
  sm: { wrap: 'w-8 h-8',   text: 'text-xs',      dot: 'w-2 h-2 bottom-0 right-0 border' },
  md: { wrap: 'w-10 h-10', text: 'text-sm',      dot: 'w-2.5 h-2.5 bottom-0 right-0 border-2' },
  lg: { wrap: 'w-12 h-12', text: 'text-base',    dot: 'w-3 h-3 bottom-0.5 right-0.5 border-2' },
};

const roleColors: Record<string, string> = {
  admin:       'bg-indigo-600',
  super_admin: 'bg-purple-600',
  foreman:     'bg-amber-500',
  management:  'bg-blue-600',
  employee:    'bg-slate-500',
};

function getInitials(profile?: ChatUserProfile | null): string {
  if (!profile) return '?';
  const f = profile.first_name?.[0] ?? '';
  const l = profile.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  profile,
  size = 'md',
  showOnline = false,
  className = '',
}) => {
  const { wrap, text, dot } = sizes[size];
  const bg = roleColors[profile?.role ?? ''] ?? 'bg-slate-500';

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {profile?.photo_url ? (
        <img
          src={profile.photo_url}
          alt={`${profile.first_name ?? ''} ${profile.last_name ?? ''}`}
          className={`${wrap} rounded-full object-cover`}
        />
      ) : (
        <div className={`${wrap} ${bg} rounded-full flex items-center justify-center select-none`}>
          <span className={`${text} font-bold text-white tracking-wide`}>{getInitials(profile)}</span>
        </div>
      )}
      {showOnline && (
        <span className={`absolute ${dot} bg-emerald-400 rounded-full border-white`} />
      )}
    </div>
  );
};

export { getInitials };
