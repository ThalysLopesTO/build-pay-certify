import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  DollarSign, 
  AlertTriangle, 
  Award, 
  FileText, 
  Check, 
  MoreHorizontal,
  ChevronRight,
  X,
  Circle,
  CheckCircle
} from 'lucide-react';
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

interface EnhancedManagementNotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

const EnhancedManagementNotificationDropdown: React.FC<EnhancedManagementNotificationDropdownProps> = ({
  notifications,
  onClose
}) => {
  const navigate = useNavigate();
  const { markAsRead, markAsUnread, dismiss, markAllAsRead, isLoading } = useNotificationActions();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Get notification icon based on type
  const getNotificationIcon = (type: string): JSX.Element => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'bill_due_soon':
        return <DollarSign className={`${iconClass} text-warning`} />;
      case 'bill_overdue':
        return <DollarSign className={`${iconClass} text-destructive`} />;
      case 'certificate':
        return <Award className={`${iconClass} text-info`} />;
      case 'attention_report':
        return <AlertTriangle className={`${iconClass} text-warning`} />;
      default:
        return <Bell className={`${iconClass} text-muted-foreground`} />;
    }
  };

  // Get user-friendly type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'bill_due_soon':
        return 'Bill Due';
      case 'bill_overdue':
        return 'Bill Overdue';
      case 'certificate':
        return 'Certificate';
      case 'attention_report':
        return 'Report';
      default:
        return 'General';
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
    if (notification.redirect_to) {
      return notification.redirect_to;
    }

    switch (notification.type) {
      case 'bill_due_soon':
      case 'bill_overdue':
        return '/management/dashboard?tab=bills-expenses';
      case 'certificate':
        return '/management/dashboard?tab=employees';
      case 'attention_report':
        return '/management/dashboard?tab=reports';
      default:
        return '/management/dashboard';
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
  const getNotificationCardClass = (notification: Notification): string => {
    if (notification.is_read) {
      return 'bg-card border border-border hover:bg-muted/50 transition-all duration-200';
    }
    
    const baseClasses = 'border-l-4 bg-gradient-to-r transition-all duration-200 hover:shadow-md';
    switch (notification.type) {
      case 'bill_overdue':
        return `${baseClasses} border-l-destructive from-destructive/5 to-transparent`;
      case 'bill_due_soon':
        return `${baseClasses} border-l-warning from-warning/5 to-transparent`;
      case 'certificate':
        return `${baseClasses} border-l-info from-info/5 to-transparent`;
      case 'attention_report':
        return `${baseClasses} border-l-warning from-warning/5 to-transparent`;
      default:
        return `${baseClasses} border-l-primary from-primary/5 to-transparent`;
    }
  };

  const renderNotificationGroup = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="px-3 py-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`mx-2 rounded-lg cursor-pointer ${getNotificationCardClass(notification)}`}
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
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm leading-5 ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {formatNotificationTitle(notification)}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        {notification.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-xs">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted/80 opacity-60 hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
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
                        {notification.is_read ? (
                          <>
                            <Circle className="h-4 w-4 mr-2" />
                            Mark unread
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark read
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(notification.id);
                        }}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Dismiss
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md">
      {/* Enhanced Header */}
      <div className="p-4 border-b bg-gradient-to-r from-card to-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {notifications.length} total
                {unreadCount > 0 && `, ${unreadCount} unread`}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isLoading}
              className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Notifications List */}
      <ScrollArea className="h-96">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-1">No notifications</h4>
            <p className="text-sm text-muted-foreground">
              We'll notify you about bills, reports, and certificates here
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {renderNotificationGroup('Today', groupedNotifications.today)}
            {renderNotificationGroup('This Week', groupedNotifications.thisWeek)}
            {renderNotificationGroup('Earlier', groupedNotifications.earlier)}
          </div>
        )}
      </ScrollArea>

      {/* Enhanced Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t bg-gradient-to-r from-muted/30 to-muted/10">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => {
              navigate('/management/dashboard?tab=notifications');
              onClose();
            }}
          >
            View all notifications
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EnhancedManagementNotificationDropdown;