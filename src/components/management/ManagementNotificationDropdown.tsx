import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, DollarSign, AlertTriangle, Award, FileText, Check, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useNotificationActions } from '@/hooks/notifications/useNotificationActions';
import { Notification } from '@/hooks/notifications/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ManagementNotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

const ManagementNotificationDropdown: React.FC<ManagementNotificationDropdownProps> = ({
  notifications,
  onClose
}) => {
  const navigate = useNavigate();
  const { markAsRead, markAsUnread, dismiss, markAllAsRead, isLoading } = useNotificationActions();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Get notification icon based on type
  const getNotificationIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'bill_due_soon':
      case 'bill_overdue':
        return <DollarSign className="h-4 w-4 text-yellow-600" />;
      case 'certificate':
        return <Award className="h-4 w-4 text-blue-600" />;
      case 'attention_report':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get user-friendly type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'bill_due_soon':
        return 'Bill Due Soon';
      case 'bill_overdue':
        return 'Bill Overdue';
      case 'certificate':
        return 'Certificate';
      case 'attention_report':
        return 'Attention Report';
      default:
        return 'Notification';
    }
  };

  // Format notification description with management-specific copy
  const formatNotificationTitle = (notification: Notification): string => {
    switch (notification.type) {
      case 'bill_due_soon':
        return notification.title.replace('Bill Due Soon:', 'Bill due soon:');
      case 'bill_overdue':
        return notification.title.replace('Bill Overdue:', 'Bill overdue:');
      case 'certificate':
        return notification.title.replace('Certificate Expiring Soon', 'Certificate expiring:');
      case 'attention_report':
        return notification.title.replace(' – New Attention Report', '');
      default:
        return notification.title;
    }
  };

  // Get management-specific redirect URL
  const getManagementRedirectUrl = (notification: Notification): string => {
    switch (notification.type) {
      case 'bill_due_soon':
      case 'bill_overdue':
        return '/management/bills-expenses';
      case 'certificate':
        return '/management/employees';
      case 'attention_report':
        return '/management/reports';
      default:
        return notification.redirect_to || '/management/dashboard';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    const url = getManagementRedirectUrl(notification);
    navigate(url);
    onClose();
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Notification[],
      thisWeek: [] as Notification[],
      earlier: [] as Notification[]
    };

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      if (notificationDate >= today) {
        groups.today.push(notification);
      } else if (notificationDate >= thisWeek) {
        groups.thisWeek.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  // Get notification background class for styling
  const getNotificationBackgroundClass = (notification: Notification): string => {
    if (!notification.is_read) {
      if (notification.type === 'bill_overdue') {
        return 'bg-red-50 border-l-4 border-l-red-500';
      }
      return 'bg-blue-50 border-l-4 border-l-blue-500';
    }
    return 'bg-background hover:bg-muted/50';
  };

  const renderNotificationGroup = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`mx-2 rounded-lg border cursor-pointer transition-colors duration-200 ${getNotificationBackgroundClass(notification)}`}
            onClick={() => handleNotificationClick(notification)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNotificationClick(notification);
              }
            }}
          >
            <div className="p-3 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-medium' : 'font-normal'} text-foreground`}>
                      {formatNotificationTitle(notification)}
                    </p>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.is_read) {
                            markAsUnread(notification.id);
                          } else {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as {notification.is_read ? 'unread' : 'read'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(notification.id);
                        }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Dismiss
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isLoading}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              You'll see updates about bills, reports, and certificates here
            </p>
          </div>
        ) : (
          <div className="py-2 space-y-4">
            {renderNotificationGroup('Today', groupedNotifications.today)}
            {renderNotificationGroup('This Week', groupedNotifications.thisWeek)}
            {renderNotificationGroup('Earlier', groupedNotifications.earlier)}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-sm"
          onClick={() => {
            navigate('/management/notifications');
            onClose();
          }}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
};

export default ManagementNotificationDropdown;