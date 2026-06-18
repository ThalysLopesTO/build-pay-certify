import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  pushSupported,
  vapidConfigured,
  getPushSubscription,
  enablePush,
  disablePush,
  EnablePushResult,
} from '@/lib/push/pushClient';

/**
 * Manages this device's Web Push subscription: whether it's supported/enabled,
 * and enable/disable actions that subscribe and persist to push_subscriptions.
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const [supported] = useState(() => pushSupported() && vapidConfigured());
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    pushSupported() ? Notification.permission : 'denied',
  );

  useEffect(() => {
    let active = true;
    getPushSubscription().then((sub) => { if (active) setEnabled(!!sub); });
    return () => { active = false; };
  }, []);

  const enable = useCallback(async (): Promise<EnablePushResult> => {
    if (!user?.id) return { ok: false, reason: 'error' };
    setLoading(true);
    try {
      const res = await enablePush(user.id, user.companyId);
      if (res.ok) setEnabled(true);
      if (pushSupported()) setPermission(Notification.permission);
      return res;
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.companyId]);

  const disable = useCallback(async () => {
    setLoading(true);
    try {
      await disablePush();
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, enabled, loading, permission, enable, disable };
};
