import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'bpc.notifPromptDismissed';

/**
 * One-time, role-agnostic prompt to turn on push. Appears for any signed-in user
 * who hasn't decided yet (permission === 'default') and hasn't dismissed it.
 * The permission request fires from the "Enable" tap (a real user gesture).
 */
const NotificationPermissionPrompt: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { supported, permission, enable, loading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  if (!isAuthenticated || !supported || permission !== 'default' || dismissed) return null;

  const close = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  const onEnable = async () => {
    await enable();
    close();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-orange-50">
          <Bell className="h-6 w-6 text-orange-600" />
        </div>
        <h2 className="text-center text-lg font-bold text-slate-900">{t('notif.promptTitle')}</h2>
        <p className="mt-1.5 text-center text-sm text-slate-500">{t('notif.promptBody')}</p>

        <div className="mt-5 space-y-2">
          <button
            onClick={onEnable}
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? t('notif.enabling') : t('notif.enable')}
          </button>
          <button
            onClick={close}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 active:bg-slate-50"
          >
            {t('notif.promptLater')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
