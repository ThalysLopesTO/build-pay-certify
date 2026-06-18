import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellRing, BellOff } from 'lucide-react';
import { notificationsSupported } from '@/hooks/useClockOutReminder';

/**
 * Opt-in control for clock-out reminders. Requests notification permission on
 * tap and reflects the current state. Hidden when the browser has no
 * Notification support.
 */
const ClockOutReminderToggle: React.FC = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationsSupported() ? Notification.permission : 'denied',
  );

  if (!notificationsSupported()) return null;

  const request = async () => {
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
    } catch {
      /* ignore */
    }
  };

  if (permission === 'granted') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
        <BellRing className="h-4 w-4" />
        {t('reminder.enabled')}
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-xs text-slate-400">
        <BellOff className="h-4 w-4" />
        {t('reminder.permissionBlocked')}
      </div>
    );
  }

  return (
    <button
      onClick={request}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 active:scale-[0.98] transition-transform"
    >
      <Bell className="h-4 w-4 text-orange-500" />
      {t('reminder.enable')}
    </button>
  );
};

export default ClockOutReminderToggle;
