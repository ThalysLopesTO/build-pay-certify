import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellRing, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Enable/disable Web Push for this device. Powers server-sent notifications
 * (timesheet approved/declined) and clock-out reminders. Hidden when push isn't
 * supported or VAPID isn't configured.
 */
const NotificationsToggle: React.FC = () => {
  const { t } = useTranslation();
  const { supported, enabled, loading, permission, enable, disable } = usePushNotifications();

  if (!supported) return null;

  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-xs text-slate-400">
        <BellOff className="h-4 w-4" />
        {t('notif.denied')}
      </div>
    );
  }

  if (enabled) {
    return (
      <button
        onClick={disable}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        <BellRing className="h-4 w-4" />
        {t('notif.enabled')}
      </button>
    );
  }

  return (
    <button
      onClick={enable}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 active:scale-[0.98] transition-transform disabled:opacity-60"
    >
      <Bell className="h-4 w-4 text-orange-500" />
      {loading ? t('notif.enabling') : t('notif.enable')}
    </button>
  );
};

export default NotificationsToggle;
