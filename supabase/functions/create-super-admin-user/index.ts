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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Auth: only an existing super_admin may create another ───────────────
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

    // ── Input ───────────────────────────────────────────────────────────────
    const { email, password, firstName, lastName } = await req.json()
    if (!email || !password) return json({ error: 'Email and password are required' }, 400)
    if (String(password).length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)

    // ── Create the auth account ─────────────────────────────────────────────
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createErr || !created.user) {
      return json({ error: createErr?.message || 'Failed to create user' }, 400)
    }

    // ── Super-admin profile (no company) ────────────────────────────────────
    const { error: profErr } = await admin.from('user_profiles').insert({
      user_id: created.user.id,
      company_id: null,
      first_name: firstName || 'Super',
      last_name: lastName || 'Admin',
      email,
      role: 'super_admin',
      is_active: true,
    })

    if (profErr) {
      // Roll back the auth account so we don't leave an orphan.
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: `Failed to create profile: ${profErr.message}` }, 400)
    }

    return json({ success: true, email })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
