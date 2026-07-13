import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFIER_ROLES = ['admin', 'foreman', 'management', 'super_admin']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    })

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@stackbuild.app'
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return json({ error: 'Push not configured (missing VAPID keys)' }, 500)
    }
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // ── Authorize the caller ────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // Multi-company aware: evaluate the caller's role in their ACTIVE company
    const { data: callerRows } = await admin
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', user.id)
    const { data: callerActiveCompanyId } = await admin
      .rpc('get_active_company_id_for', { p_user_id: user.id })
    const caller =
      (callerRows ?? []).find((r) => r.role === 'super_admin') ||
      (callerRows ?? []).find((r) => r.company_id === callerActiveCompanyId) ||
      (callerRows ?? [])[0]
    if (!caller || !NOTIFIER_ROLES.includes(caller.role)) {
      return json({ error: 'Forbidden' }, 403)
    }

    // ── Input ───────────────────────────────────────────────────────────────
    const { userIds, title, body, url, tag } = await req.json()
    if (!Array.isArray(userIds) || userIds.length === 0 || !title) {
      return json({ error: 'userIds[] and title are required' }, 400)
    }

    // Only notify users in the caller's company (super_admin may cross companies).
    let targetIds: string[] = userIds
    if (caller.role !== 'super_admin') {
      const { data: targets } = await admin
        .from('user_profiles')
        .select('user_id')
        .in('user_id', userIds)
        .eq('company_id', caller.company_id)
      targetIds = (targets ?? []).map((t) => t.user_id)
    }
    if (targetIds.length === 0) return json({ sent: 0, removed: 0 })

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', targetIds)

    const payload = JSON.stringify({ title, body: body ?? '', url: url ?? '/', tag })
    let sent = 0
    const dead: string[] = []

    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          )
          sent++
        } catch (e: any) {
          const code = e?.statusCode
          if (code === 404 || code === 410) dead.push(s.id)
        }
      }),
    )

    // Prune expired/unsubscribed endpoints.
    if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead)

    return json({ sent, removed: dead.length })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
