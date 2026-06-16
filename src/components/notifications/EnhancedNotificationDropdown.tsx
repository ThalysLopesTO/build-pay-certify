import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, CheckCircle, Circle, X, Bell, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Notification } from '@/hooks/notifications/types';
import { useNotificationActions } from '@/hooks/notifications/useNotificationActions';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { metaFor } from './notificationMeta';
import { useTodaysBirthdays } from '@/hooks/useTodaysBirthdays';
import BirthdayNotificationBanner from './BirthdayNotificationBanner';

interface EnhancedNotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

const EnhancedNotificationDropdown: React.FC<EnhancedNotificationDropdownProps> = ({ notifications, onClose }) => {
  const { markAsRead, markAsUnread, dismiss, markAllAsRead, clearAllNotifications, isLoading } = useNotificationActions();
  const { data: birthdayPeople = [] } = useTodaysBirthdays();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getRedirectUrl = (notification: Notification) => {
    if (notification.redirect_to) return notification.redirect_to;
    switch (notification.type) {
      case 'certificate':        return '/admin/employees';
      case 'jobsite':            return '/admin/jobsites';
      case 'material_request':   return '/admin/material-requests';
      case 'attention_report':   return '/admin/attention-reports';
      case 'daily_report':       return '/admin/daily-reports';
      case 'bill_due_soon':
      case 'bill_overdue':       return '/admin/bills-expenses';
      case 'invoice_due_soon':
      case 'invoice_overdue':    return '/admin/invoices';
      default:                   return '/admin/dashboard';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) markAsRead(notification.id);
    navigate(getRedirectUrl(notification));
    onClose();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const groupNotificationsByDate = (items: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const groups = { today: [] as Notification[], thisWeek: [] as Notification[], earlier: [] as Notification[] };
    items.forEach(n => {
      const d = new Date(n.created_at);
      if (d >= today) groups.today.push(n);
      else if (d >= thisWeek) groups.thisWeek.push(n);
      else groups.earlier.push(n);
    });
    return groups;
  };

  const grouped = groupNotificationsByDate(notifications);

  const renderItem = (notification: Notification) => {
    const meta = metaFor(notification.type);
    const Icon = meta.icon;
    const unread = !notification.is_read;

    return (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors ${unread ? 'bg-orange-50/40 hover:bg-orange-50/70' : 'hover:bg-slate-50'}`}
      >
        {unread && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500 rounded-r" />}

        <div className={`p-2 rounded-xl flex-shrink-0 h-fit ${meta.bg}`}>
          <Icon className={`h-[18px] w-[18px] ${meta.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm leading-snug ${unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
              {notification.title}
            </p>
            {/* Hover actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 -mr-1 -mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    unread ? markAsRead(notification.id) : markAsUnread(notification.id);
                  }}
                >
                  {unread ? <CheckCircle className="h-4 w-4 mr-2" /> : <Circle className="h-4 w-4 mr-2" />}
                  {unread ? 'Mark as read' : 'Mark as unread'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); dismiss(notification.id); }}
                  className="text-red-600 focus:text-red-600"
                >
                  <X className="h-4 w-4 mr-2" /> Dismiss
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {notification.description && (
            <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
              {notification.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
            <span className={`font-medium ${meta.text}`}>{meta.label}</span>
            <span className="text-slate-300">·</span>
            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="px-4 pt-3 pb-1.5">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
        </div>
        <div className="divide-y divide-slate-50">
          {items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white border border-slate-200/70 shadow-xl rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="p-2 rounded-xl bg-slate-900">
              <Bell className="h-4 w-4 text-white" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Notifications</h3>
            <p className="text-xs text-slate-400">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="max-h-[26rem]">
        <BirthdayNotificationBanner people={birthdayPeople} />
        {notifications.length === 0 ? (
          birthdayPeople.length === 0 && (
            <div className="px-8 py-12 text-center">
              <div className="p-3.5 bg-slate-50 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bell className="h-7 w-7 text-slate-300" />
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">You're all caught up</h4>
              <p className="text-xs text-slate-400 max-w-[15rem] mx-auto leading-relaxed mt-1">
                We'll let you know here when something needs your attention.
              </p>
            </div>
          )
        ) : (
          <div className="pb-1">
            {renderGroup('Today', grouped.today)}
            {renderGroup('This Week', grouped.thisWeek)}
            {renderGroup('Earlier', grouped.earlier)}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-2 py-1.5 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-9 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
            onClick={() => setShowClearConfirm(true)}
            disabled={isLoading}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear all notifications
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear all notifications?"
        description="This will remove all notifications from your list. This action cannot be undone."
        confirmText="Clear all"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isLoading}
        onConfirm={() => {
          clearAllNotifications();
          setShowClearConfirm(false);
        }}
      />
    </div>
  );
};

export default EnhancedNotificationDropdown;
