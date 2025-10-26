
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendUserWelcomeEmail } from './email-service.ts'

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

    const { 
      email, 
      password, 
      firstName = 'User',
      lastName = '',
      companyName = 'Your Company'
    } = await req.json()

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

    console.log('User created successfully:', user.user?.email)

    // Send welcome email (non-blocking - don't fail if email fails)
    try {
      const emailResult = await sendUserWelcomeEmail({
        email,
        firstName,
        lastName,
        companyName,
        password,
      });
      
      if (emailResult.success) {
        console.log('Welcome email sent successfully to:', email);
      } else {
        console.warn('Failed to send welcome email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending welcome email (non-blocking):', emailError);
      // Continue execution - don't fail user creation due to email issues
    }

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
