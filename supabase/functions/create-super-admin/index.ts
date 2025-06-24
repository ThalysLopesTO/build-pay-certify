
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    const { email, password, firstName, lastName, companyId, companyName } = await req.json()

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
        role: 'admin',
        pending_approval: false,
        stripe_verified: true
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Apply default company rules if available
    try {
      // Fetch default rule from default_rules table
      const { data: defaultRule, error: ruleError } = await supabaseAdmin
        .from('default_rules')
        .select('content')
        .limit(1)
        .single()

      if (ruleError) {
        console.error('Error fetching default rule:', ruleError)
      } else if (defaultRule?.content) {
        // Insert default rule into company_settings
        const { error: settingsError } = await supabaseAdmin
          .from('company_settings')
          .insert({
            company_id: companyId,
            company_name: companyName,
            company_rules_text: defaultRule.content
          })

        if (settingsError) {
          console.error('Error inserting default rules to company settings:', settingsError)
          // Don't fail the function, just log the error
        } else {
          console.log('Default rules applied successfully to company:', companyId)
        }
      }
    } catch (ruleApplyError) {
      console.error('Unexpected error applying default rules:', ruleApplyError)
      // Continue with function execution
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
