import { supabase } from '@/integrations/supabase/client';

/**
 * Fire a Web Push to one or more users via the send-push edge function.
 * Best-effort and non-blocking — failures never break the triggering action.
 */
export async function notifyUsers(
  userIds: string[],
  title: string,
  body: string,
  url?: string,
  tag?: string,
): Promise<void> {
  const ids = userIds.filter(Boolean);
  if (ids.length === 0) return;
  try {
    await supabase.functions.invoke('send-push', {
      body: { userIds: ids, title, body, url, tag },
    });
  } catch (e) {
    console.warn('Push notify failed (non-fatal):', e);
  }
}
