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
  CheckCircle,
  Upload,
  Building2,
  User
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
    const iconClass = "h-6 w-6";
    const iconProps = { className: iconClass };
    
    switch (type) {
      case 'bill_due_soon':
        return (
          <div className="p-2 bg-yellow-50 rounded-full border border-yellow-200">
            <DollarSign {...iconProps} className="h-5 w-5 text-yellow-600" />
          </div>
        );
      case 'bill_overdue':
        return (
          <div className="p-2 bg-red-50 rounded-full border border-red-200">
            <DollarSign {...iconProps} className="h-5 w-5 text-red-600" />
          </div>
        );
      case 'certificate':
        return (
          <div className="p-2 bg-blue-50 rounded-full border border-blue-200">
            <Award {...iconProps} className="h-5 w-5 text-blue-600" />
          </div>
        );
      case 'attention_report':
        return (
          <div className="p-2 bg-orange-50 rounded-full border border-orange-200">
            <AlertTriangle {...iconProps} className="h-5 w-5 text-orange-600" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-50 rounded-full border border-gray-200">
            <Bell {...iconProps} className="h-5 w-5 text-gray-600" />
          </div>
        );
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
        return 'Certificate Alert';
      case 'attention_report':
        return 'Attention Report';
      default:
        return 'Notification';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'bill_due_soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'bill_overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'certificate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'attention_report':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      case 'bill_overdue':       return '/management/bills-expenses';
      case 'certificate':        return '/management/employees';
      case 'attention_report':   return '/management/attention-reports';
      case 'material_request':   return '/management/material-requests';
      case 'daily_report':       return '/management/daily-reports';
      case 'invoice_due_soon':
      case 'invoice_overdue':    return '/management/invoices';
      default:                   return '/management/dashboard';
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
    const baseClasses = 'bg-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300';
    
    if (notification.is_read) {
      return `${baseClasses} border-gray-200 bg-gray-50/50`;
    }
    
    return `${baseClasses} border-gray-200 shadow-sm`;
  };

  const renderNotificationGroup = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="px-4 py-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`mx-3 rounded-xl cursor-pointer ${getNotificationCardClass(notification)}`}
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
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-semibold leading-5 ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {formatNotificationTitle(notification)}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        {notification.description && (
                          <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3">
                          <Badge 
                            className={`text-xs px-3 py-1 font-medium border ${getTypeBadgeClass(notification.type)}`}
                          >
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <div className="flex items-center gap-2 text-gray-500">
                            <span className="text-xs">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <ChevronRight className="h-4 w-4" />
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
                        className="h-8 w-8 p-0 hover:bg-gray-100 opacity-60 hover:opacity-100 transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-200 shadow-lg">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.is_read) {
                            markAsUnread(notification.id);
                          } else {
                            markAsRead(notification.id);
                          }
                        }}
                        className="hover:bg-gray-50"
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
                        className="text-red-600 hover:bg-red-50"
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
    <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
      {/* Enhanced Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
              <p className="text-sm text-gray-600">
                {notifications.length} total
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Notifications List */}
      <ScrollArea className="h-96 bg-gray-50/30">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Bell className="h-10 w-10 text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2 text-base">No notifications</h4>
            <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">
              You're all caught up! We'll notify you about bills, reports, and certificates here.
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

      {/* Footer — clear only, no broken "view all" link */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-white">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors rounded-lg py-3 font-medium"
            onClick={() => markAllAsRead()}
          >
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
};

export default EnhancedManagementNotificationDropdown;