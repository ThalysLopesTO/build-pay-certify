import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const vapidConfigured = () => !!VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export type EnablePushResult = { ok: true } | { ok: false; reason: 'unsupported' | 'missing-vapid' | 'denied' | 'error' };

/**
 * Request permission, subscribe via the PushManager, and persist the
 * subscription so the server can push to this device.
 */
export async function enablePush(userId: string, companyId?: string | null): Promise<EnablePushResult> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'missing-vapid' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }
    const json = sub.toJSON();
    const { error } = await (supabase as any).from('push_subscriptions').upsert(
      {
        user_id: userId,
        company_id: companyId ?? null,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'endpoint' },
    );
    if (error) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function disablePush(): Promise<void> {
  const sub = await getPushSubscription();
  if (!sub) return;
  try {
    await (supabase as any).from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  } finally {
    await sub.unsubscribe().catch(() => undefined);
  }
}
