import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { useTodaysBirthdays, birthdaySeenToday, markBirthdaySeen } from '@/hooks/useTodaysBirthdays';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EnhancedManagementNotificationDropdown from './EnhancedManagementNotificationDropdown';

const ManagementNotificationBell = () => {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: birthdayPeople = [] } = useTodaysBirthdays();
  const [isOpen, setIsOpen] = useState(false);
  const [birthdaySeen, setBirthdaySeen] = useState(birthdaySeenToday);

  // Only show for management and super_admin roles
  if (!user || !['management', 'super_admin'].includes(user.role || '')) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const showBirthdayDot = birthdayPeople.length > 0 && !birthdaySeen;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && birthdayPeople.length > 0) {
      markBirthdaySeen();
      setBirthdaySeen(true);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-green-100 transition-colors"
          disabled={isLoading}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-green-700" />
          {showBirthdayDot && unreadCount === 0 && (
            <>
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-pink-500 animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-pink-500" />
            </>
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px] bg-green-600 hover:bg-green-700"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-background border-green-200" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <EnhancedManagementNotificationDropdown 
          notifications={notifications}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default ManagementNotificationBell;