import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useClockSession } from './useOfflineClock';

/** Fire a clock-out reminder once the shift passes this many hours. */
const REMINDER_AFTER_HOURS = 9;

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

const showReminder = async (title: string, body: string) => {
  try {
    if (navigator.serviceWorker?.ready) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png',
        badge: '/favicon.ico',
        tag: 'clock-out-reminder',
      });
      return;
    }
  } catch {
    /* fall through to page notification */
  }
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body });
  } catch {
    /* notifications unavailable */
  }
};

/**
 * Mounted once (in the employee layout): while clocked in and notifications are
 * granted, fires a single "don't forget to clock out" reminder after a long
 * shift. Reads Notification.permission live so enabling it anywhere takes effect.
 * Note: this is a local reminder — it fires while the app is alive; reliable
 * closed-app reminders need server push (a planned follow-up).
 */
export const useClockOutReminderEngine = () => {
  const { t } = useTranslation();
  const { session } = useClockSession();
  const checkInTime = session?.check_in_time ?? null;
  const sessionId = session?.id ?? null;
  const jobsiteName = session?.jobsiteName ?? '';

  useEffect(() => {
    if (!checkInTime || !sessionId || !notificationsSupported()) return;

    const flagKey = `bpc.clockoutReminded.${sessionId}`;

    const check = () => {
      if (Notification.permission !== 'granted') return;
      if (localStorage.getItem(flagKey)) return;
      const hours = (Date.now() - new Date(checkInTime).getTime()) / 3_600_000;
      if (hours >= REMINDER_AFTER_HOURS) {
        localStorage.setItem(flagKey, '1');
        void showReminder(
          t('reminder.title'),
          t('reminder.body', { hours: Math.floor(hours), jobsite: jobsiteName }),
        );
      }
    };

    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [checkInTime, sessionId, jobsiteName, t]);
};
