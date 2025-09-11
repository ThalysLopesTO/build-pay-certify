
import React from 'react';
import { format } from 'date-fns';
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
  ClipboardList
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

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  notifications, 
  onClose 
}) => {
  const { markAsRead, markAsUnread, dismiss, markAllAsRead } = useNotificationActions();
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'jobsite':
        return <Calendar className="h-4 w-4 text-red-500" />;
      case 'material_request':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'attention_report':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'daily_report':
        return <ClipboardList className="h-4 w-4 text-green-500" />;
      case 'bill_due_soon':
        return <DollarSign className="h-4 w-4 text-orange-500" />;
      case 'bill_overdue':
        return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'invoice_due_soon':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'invoice_overdue':
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'certificate':
        return 'Certificate';
      case 'jobsite':
        return 'Jobsite';
      case 'material_request':
        return 'Material Request';
      case 'attention_report':
        return 'Attention Report';
      case 'daily_report':
        return 'Daily Report';
      case 'bill_due_soon':
        return 'Bill Due Soon';
      case 'bill_overdue':
        return 'Bill Overdue';
      case 'invoice_due_soon':
        return 'Invoice Due Soon';
      case 'invoice_overdue':
        return 'Invoice Overdue';
      default:
        return 'Notification';
    }
  };

  const getRedirectUrl = (notification: Notification) => {
    // Use the redirect_to field if available, otherwise fall back to default routing
    if (notification.redirect_to) {
      return notification.redirect_to;
    }

    // Fallback routing logic for existing notifications without redirect_to
    switch (notification.type) {
      case 'certificate':
        return '/admin/employee-management';
      case 'jobsite':
        return '/admin/jobsite-management';
      case 'material_request':
        return '/admin/material-requests';
      case 'attention_report':
        return '/admin/attention-reports';
      case 'daily_report':
        return '/admin/daily-reports';
      case 'bill_due_soon':
      case 'bill_overdue':
        return '/admin/bills-expenses';
      case 'invoice_due_soon':
      case 'invoice_overdue':
        return '/admin/invoice-management';
      default:
        return '/admin/dashboard';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate using the dynamic redirect URL
    const redirectUrl = getRedirectUrl(notification);
    navigate(redirectUrl);
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationBackgroundClass = (notification: Notification) => {
    if (notification.is_read) return '';
    
    switch (notification.type) {
      case 'bill_overdue':
      case 'invoice_overdue':
        return 'bg-red-50 border-l-2 border-l-red-500';
      case 'bill_due_soon':
      case 'invoice_due_soon':
        return 'bg-orange-50 border-l-2 border-l-orange-500';
      default:
        return 'bg-blue-50 border-l-2 border-l-blue-500';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div 
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    getNotificationBackgroundClass(notification)
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(notification.created_at), 'MMM dd, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
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
                              <Circle className="h-3 w-3 mr-2" />
                              Mark unread
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-2" />
                              Mark read
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(notification.id);
                          }}
                          className="text-red-600"
                        >
                          <X className="h-3 w-3 mr-2" />
                          Dismiss
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationDropdown;
