// Creates the admin account for a company when a super admin approves a
// registration request. Despite the name, it never creates super admins
// (use create-super-admin-user for that).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Only a signed-in super admin may create accounts here. Without this,
    // anyone holding the public anon key could create confirmed accounts.
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
    if (!caller) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: callerProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'super_admin')
      .limit(1)

    if (!callerProfiles || callerProfiles.length === 0) {
      return jsonResponse({ error: 'Forbidden — super admin only' }, 403)
    }

    const { email, password, firstName, lastName, companyId } = await req.json()

    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400)
    }

    // Every account made here belongs to a real company; no company-less admins.
    if (!companyId) {
      return jsonResponse({ error: 'companyId is required' }, 400)
    }

    const userRole = 'admin'

    // Create user with Admin API
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation
    })

    if (error) {
      console.error('Error creating user:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: user.user?.id,
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        role: userRole,
        pending_approval: false,
        stripe_verified: true
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Remove the login we just made so a failed approval leaves no orphan account
      if (user.user?.id) await supabaseAdmin.auth.admin.deleteUser(user.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User created successfully:', user.user?.email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: user.user,
        message: 'User created successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
