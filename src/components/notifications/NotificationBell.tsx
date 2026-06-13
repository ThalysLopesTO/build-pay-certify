import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EnhancedNotificationDropdown from './EnhancedNotificationDropdown';

const NotificationBell = () => {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !['admin', 'super_admin', 'foreman', 'management'].includes(user.role || '')) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={isLoading}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <>
              {/* Pulse ring */}
              <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 animate-ping opacity-75" />
              {/* Solid badge */}
              <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 flex items-center justify-center">
                {unreadCount > 9 && (
                  <span className="text-white text-[8px] font-bold leading-none">
                    {unreadCount > 99 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end" side="bottom" sideOffset={8}>
        <EnhancedNotificationDropdown
          notifications={notifications}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
