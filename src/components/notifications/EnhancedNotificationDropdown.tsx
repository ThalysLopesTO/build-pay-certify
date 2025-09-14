import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  AlertCircle, 
  Calendar, 
  Package, 
  AlertTriangle, 
  MoreHorizontal,
  CheckCircle,
  Circle,
  X,
  Bell,
  DollarSign,
  FileText,
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Notification } from '@/hooks/notifications/types';
import { useNotificationActions } from '@/hooks/notifications/useNotificationActions';
import { useNavigate } from 'react-router-dom';

interface EnhancedNotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

const EnhancedNotificationDropdown: React.FC<EnhancedNotificationDropdownProps> = ({ 
  notifications, 
  onClose 
}) => {
  const { markAsRead, markAsUnread, dismiss, markAllAsRead } = useNotificationActions();
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'certificate':
        return <AlertCircle className={`${iconClass} text-warning`} />;
      case 'jobsite':
        return <Calendar className={`${iconClass} text-destructive`} />;
      case 'material_request':
        return <Package className={`${iconClass} text-info`} />;
      case 'attention_report':
        return <AlertTriangle className={`${iconClass} text-warning`} />;
      case 'daily_report':
        return <ClipboardList className={`${iconClass} text-success`} />;
      case 'bill_due_soon':
        return <DollarSign className={`${iconClass} text-warning`} />;
      case 'bill_overdue':
        return <DollarSign className={`${iconClass} text-destructive`} />;
      case 'invoice_due_soon':
        return <FileText className={`${iconClass} text-warning`} />;
      case 'invoice_overdue':
        return <FileText className={`${iconClass} text-destructive`} />;
      default:
        return <Circle className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'certificate':
        return 'Certificate';
      case 'jobsite':
        return 'Jobsite';
      case 'material_request':
        return 'Material';
      case 'attention_report':
        return 'Report';
      case 'daily_report':
        return 'Daily Report';
      case 'bill_due_soon':
        return 'Bill Due';
      case 'bill_overdue':
        return 'Bill Overdue';
      case 'invoice_due_soon':
        return 'Invoice Due';
      case 'invoice_overdue':
        return 'Invoice Overdue';
      default:
        return 'General';
    }
  };

  const getRedirectUrl = (notification: Notification) => {
    if (notification.redirect_to) {
      return notification.redirect_to;
    }

    switch (notification.type) {
      case 'certificate':
        return '/admin/dashboard?tab=employees';
      case 'jobsite':
        return '/admin/dashboard?tab=jobsites';
      case 'material_request':
        return '/admin/dashboard?tab=material-requests';
      case 'attention_report':
        return '/admin/dashboard?tab=attention-reports';
      case 'daily_report':
        return '/admin/dashboard?tab=daily-reports';
      case 'bill_due_soon':
      case 'bill_overdue':
        return '/admin/dashboard?tab=bills-expenses';
      case 'invoice_due_soon':
      case 'invoice_overdue':
        return '/admin/dashboard?tab=invoices';
      default:
        return '/admin/dashboard';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const redirectUrl = getRedirectUrl(notification);
    navigate(redirectUrl);
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationCardClass = (notification: Notification) => {
    if (notification.is_read) {
      return 'bg-card border border-border hover:bg-muted/50 transition-all duration-200';
    }
    
    const baseClasses = 'border-l-4 bg-gradient-to-r transition-all duration-200 hover:shadow-md';
    switch (notification.type) {
      case 'bill_overdue':
      case 'invoice_overdue':
        return `${baseClasses} border-l-destructive from-destructive/5 to-transparent`;
      case 'bill_due_soon':
      case 'invoice_due_soon':
      case 'certificate':
        return `${baseClasses} border-l-warning from-warning/5 to-transparent`;
      case 'attention_report':
        return `${baseClasses} border-l-warning from-warning/5 to-transparent`;
      default:
        return `${baseClasses} border-l-primary from-primary/5 to-transparent`;
    }
  };

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
                            {notification.title}
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
              We'll notify you when something needs your attention
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
              navigate('/admin/dashboard?tab=notifications');
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

export default EnhancedNotificationDropdown;