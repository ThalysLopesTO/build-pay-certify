import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'npm:web-push@3.6.7'

// Called by Supabase Database Webhooks on INSERT into `notifications` and
// `chat_messages`. Resolves recipients and fans a Web Push out to each of their
// devices. Authenticated by a shared secret header (no user JWT — deploy with
// Verify JWT OFF).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-push-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    })

  try {
    const SECRET = Deno.env.get('PUSH_WEBHOOK_SECRET')
    if (!SECRET || req.headers.get('x-push-secret') !== SECRET) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@stackbuild.app'
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ error: 'Missing VAPID keys' }, 500)
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const payload = await req.json()
    const table: string = payload.table
    const record: Record<string, any> = payload.record ?? {}

    let recipientIds: string[] = []
    let title = 'StackBuild'
    let body = ''
    let url = '/'
    let tag: string | undefined

    if (table === 'chat_messages') {
      const { data: members } = await admin
        .from('chat_members')
        .select('user_id')
        .eq('conversation_id', record.conversation_id)
        .neq('user_id', record.sender_id)
      recipientIds = (members ?? []).map((m) => m.user_id)

      const { data: sender } = await admin
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', record.sender_id)
        .limit(1)
        .single()
      title = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ') || 'New message'
      body = String(record.content ?? '').slice(0, 140)
      url = '/'
      tag = `chat-${record.conversation_id}`
    } else if (table === 'notifications') {
      if (record.target_user_id) {
        recipientIds = [record.target_user_id]
      } else {
        const { data: users } = await admin
          .from('user_profiles')
          .select('user_id')
          .eq('company_id', record.company_id)
          .eq('role', record.user_role)
          .eq('is_active', true)
        recipientIds = (users ?? []).map((u) => u.user_id)
      }
      title = record.title || 'New notification'
      body = record.description || ''
      url = record.redirect_to || '/'
      tag = record.type || undefined
    } else {
      return json({ skipped: `unhandled table ${table}` })
    }

    if (recipientIds.length === 0) return json({ sent: 0, removed: 0 })

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', recipientIds)

    const message = JSON.stringify({ title, body, url, tag })
    let sent = 0
    const dead: string[] = []

    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            message,
          )
          sent++
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.id)
        }
      }),
    )

    if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead)

    return json({ table, recipients: recipientIds.length, sent, removed: dead.length })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
