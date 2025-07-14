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
    console.log('Username authentication request received')

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
    let loginData
    try {
      const requestBody = await req.json()
      loginData = requestBody
      
      if (!loginData.username || !loginData.password) {
        console.error('Missing username or password in request body')
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Username and password are required' 
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

    console.log('Looking up user by username:', loginData.username)

    // Look up the user by username in the auth.users metadata
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authentication service unavailable' 
        }),
        {
          headers: corsHeaders,
          status: 500,
        },
      )
    }

    // Find user with matching username
    const user = users.users.find(u => 
      u.user_metadata?.username === loginData.username
    )

    if (!user) {
      console.log('User not found with username:', loginData.username)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid username or password' 
        }),
        {
          headers: corsHeaders,
          status: 401,
        },
      )
    }

    // Create a regular Supabase client for authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Try to authenticate with the user's email and provided password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: loginData.password
    })

    if (authError) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid username or password' 
        }),
        {
          headers: corsHeaders,
          status: 401,
        },
      )
    }

    // Verify user role if specified
    if (loginData.expectedRole) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Unable to verify user role. Please contact your administrator.' 
          }),
          {
            headers: corsHeaders,
            status: 403,
          },
        )
      }

      // Check role compatibility
      if (loginData.expectedRole === 'employee' && profile.role !== 'employee') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'This login page is for employees only. Please use the Company Login page.' 
          }),
          {
            headers: corsHeaders,
            status: 403,
          },
        )
      }

      if (loginData.expectedRole === 'admin' && profile.role === 'employee') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'This login page is for company/admin users only. Please use the Employee Login page.' 
          }),
          {
            headers: corsHeaders,
            status: 403,
          },
        )
      }
    }

    console.log('Username authentication successful for:', loginData.username)

    return new Response(
      JSON.stringify({ 
        success: true,
        session: authData.session,
        user: authData.user,
        message: 'Authentication successful' 
      }),
      {
        headers: corsHeaders,
        status: 200,
      },
    )

  } catch (error) {
    console.error('Unexpected error in authenticate-username function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Authentication failed: ' + (error?.message || 'Unknown error occurred')
      }),
      {
        headers: corsHeaders,
        status: 500,
      },
    )
  }
})