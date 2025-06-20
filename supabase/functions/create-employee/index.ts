
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Employee creation request received')

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
    let employeeData
    try {
      const requestBody = await req.json()
      employeeData = requestBody.employeeData
      
      if (!employeeData) {
        console.error('Missing employeeData in request body')
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Missing employee data in request' 
          }),
          {
            headers: corsHeaders,
            status: 400,
          },
        )
      }
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request body format' 
        }),
        {
          headers: corsHeaders,
          status: 400,
        },
      )
    }

    console.log('Creating employee with data:', { 
      email: employeeData.email, 
      role: employeeData.role, 
      companyId: employeeData.companyId 
    })

    // First, check if the company can add more employees
    const { data: canAdd, error: checkError } = await supabaseAdmin
      .rpc('can_add_employee', { company_id_param: employeeData.companyId })

    if (checkError) {
      console.error('Error checking employee limit:', checkError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to check employee limit: ' + checkError.message
        }),
        {
          headers: corsHeaders,
          status: 500,
        },
      )
    }

    if (!canAdd) {
      console.log('Employee limit reached for company:', employeeData.companyId)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Employee limit reached for your current plan. Please upgrade to add more employees.' 
        }),
        {
          headers: corsHeaders,
          status: 400,
        },
      )
    }

    // Check if a user with this email already exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to verify user uniqueness: ' + userCheckError.message
        }),
        {
          headers: corsHeaders,
          status: 500,
        },
      )
    }

    // Check if user with this email already exists
    const emailExists = existingUser.users.some(user => user.email === employeeData.email)
    if (emailExists) {
      console.log('User with email already exists:', employeeData.email)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `An account with email ${employeeData.email} already exists. Please use a different email address.` 
        }),
        {
          headers: corsHeaders,
          status: 400,
        },
      )
    }

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
        company_id: employeeData.companyId, // Ensure company_id is in metadata
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create user account: ' + authError.message
        }),
        {
          headers: corsHeaders,
          status: 400,
        },
      )
    }

    console.log('User created successfully:', authData.user?.email)

    // Create user profile with the correct company_id
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        company_id: employeeData.companyId,
        first_name: employeeData.firstName,
        last_name: employeeData.lastName,
        role: employeeData.role,
        trade: employeeData.trade,
        hourly_rate: employeeData.hourlyRate,
        pending_approval: false
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Try to delete the auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        console.log('Cleaned up auth user after profile creation failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create user profile: ' + profileError.message
        }),
        {
          headers: corsHeaders,
          status: 500,
        },
      )
    }

    console.log('User profile created successfully for company:', employeeData.companyId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: 'Employee registered successfully' 
      }),
      {
        headers: corsHeaders,
        status: 200,
      },
    )

  } catch (error) {
    console.error('Unexpected error in create-employee function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Employee creation failed: ' + (error?.message || 'Unknown error occurred')
      }),
      {
        headers: corsHeaders,
        status: 500,
      },
    )
  }
})
