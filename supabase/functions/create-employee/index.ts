
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
    console.log('Auth user creation request received')

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
    let userData
    try {
      const requestBody = await req.json()
      userData = requestBody
      
      if (!userData.email || !userData.password) {
        console.error('Missing required fields in request body')
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Missing required fields: email and password' 
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

    console.log('Creating auth user with data:', { 
      email: userData.email, 
      firstName: userData.firstName,
      lastName: userData.lastName,
      companyId: userData.companyId
    })

    // Check if the company can add more employees
    const { data: canAdd, error: checkError } = await supabaseAdmin
      .rpc('can_add_employee', { company_id_param: userData.companyId })

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
      console.log('Employee limit reached for company:', userData.companyId)
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
    const emailExists = existingUser.users.some(user => user.email === userData.email)
    if (emailExists) {
      console.log('User with email already exists:', userData.email)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `An account with email ${userData.email} already exists. Please use a different email address.` 
        }),
        {
          headers: corsHeaders,
          status: 400,
        },
      )
    }

    // Create the user account with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        company_id: userData.companyId,
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

    console.log('Auth user created successfully:', authData.user?.email)

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
