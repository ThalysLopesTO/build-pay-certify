
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EnhancedNotificationDropdown from './EnhancedNotificationDropdown';

const NotificationBell = () => {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for admin, super_admin, foreman, and management roles
  if (!user || !['admin', 'super_admin', 'foreman', 'management'].includes(user.role || '')) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-gray-100"
          disabled={isLoading}
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <EnhancedNotificationDropdown 
          notifications={notifications}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
