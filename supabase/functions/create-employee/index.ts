
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
    // Create a Supabase client with service role privileges
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

    // Get the request data
    const { employeeData } = await req.json()

    console.log('Creating employee with data:', { email: employeeData.email, role: employeeData.role })

    // Create the user account with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: employeeData.email,
      password: employeeData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: employeeData.firstName,
        last_name: employeeData.lastName,
        address: employeeData.address,
        phone_number: employeeData.phoneNumber,
        role: employeeData.role,
        trade: employeeData.trade,
        hourly_rate: employeeData.hourlyRate,
        // Certificate expiry dates
        work_at_heights_expiry: employeeData.workAtHeightsExpiry,
        whmis_expiry: employeeData.whmisExpiry,
        four_steps_expiry: employeeData.fourStepsExpiry,
        five_steps_expiry: employeeData.fiveStepsExpiry,
        lift_operator_expiry: employeeData.liftOperatorExpiry,
        must_change_password: true, // Force password change on first login
      },
    })

    if (authError) {
      console.error('Error creating user:', authError)
      throw authError
    }

    console.log('User created successfully:', authData.user?.email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: 'Employee registered successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
