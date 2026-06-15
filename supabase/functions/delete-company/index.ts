import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ── Auth: the caller must be a super_admin ──────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: caller } = await admin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!caller || caller.role !== 'super_admin') {
      return json({ error: 'Forbidden — super admin only' }, 403)
    }

    // ── Input + safety confirmation ─────────────────────────────────────────
    const { companyId, confirmName } = await req.json()
    if (!companyId) return json({ error: 'Missing companyId' }, 400)

    const { data: company, error: cErr } = await admin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (cErr || !company) return json({ error: 'Company not found' }, 404)

    if ((confirmName ?? '').trim() !== (company.name ?? '').trim()) {
      return json({ error: 'Confirmation name does not match the company name' }, 400)
    }

    // ── Collect the company's users up front ────────────────────────────────
    const { data: profiles } = await admin
      .from('user_profiles')
      .select('user_id')
      .eq('company_id', companyId)

    const userIds = [...new Set((profiles ?? []).map((p: any) => p.user_id).filter(Boolean))] as string[]

    // ── Delete the company first (relies on ON DELETE CASCADE for its data).
    // If this fails we abort BEFORE touching any auth accounts, so we never
    // leave a half-deleted company behind.
    const { error: delErr } = await admin.from('companies').delete().eq('id', companyId)
    if (delErr) {
      return json({
        error: `Could not delete the company: ${delErr.message}. A related table may not cascade — no users were removed.`,
      }, 409)
    }

    // ── Remove the auth accounts (their profiles cascade with the company) ──
    let deletedUsers = 0
    const failures: string[] = []
    for (const uid of userIds) {
      const { error } = await admin.auth.admin.deleteUser(uid)
      if (error) failures.push(`${uid}: ${error.message}`)
      else deletedUsers++
    }

    return json({ success: true, company: company.name, totalUsers: userIds.length, deletedUsers, failures })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
