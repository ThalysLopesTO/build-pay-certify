
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

    const { email, password, firstName, lastName } = await req.json()

    console.log('Creating user account for:', email)

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers.users.find(user => user.email === email)

    if (userExists) {
      console.log('User already exists, checking profile...')
      
      // Check if user profile exists
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userExists.id)
        .single()

      if (profile) {
        // Update existing profile
        const { data: updatedProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            first_name: firstName || profile.first_name,
            last_name: lastName || profile.last_name,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userExists.id)
          .select()
          .single()

        if (profileError) {
          console.error('Error updating existing profile:', profileError)
          return new Response(
            JSON.stringify({ error: 'Failed to update existing user profile' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: userExists,
            profile: updatedProfile,
            message: 'User already exists, profile updated' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        // Create profile for existing user
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            user_id: userExists.id,
            role: 'admin',
            first_name: firstName || 'Admin',
            last_name: lastName || 'User',
            pending_approval: false
          })
          .select()
          .single()

        if (profileError) {
          console.error('Error creating profile for existing user:', profileError)
          return new Response(
            JSON.stringify({ error: 'Failed to create user profile' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: userExists,
            profile: newProfile,
            message: 'Profile created for existing user' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Create new user with Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        role: firstName && lastName && email.includes('thalyslopesdev') ? 'super_admin' : 'admin',
        first_name: firstName || 'Admin',
        last_name: lastName || 'User'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created successfully:', authUser.user?.email)

    // Determine if this is a super admin (Thalys) or regular admin
    const userRole = firstName && lastName && email.includes('thalyslopesdev') ? 'super_admin' : 'admin'
    let companyId = null

    if (userRole === 'super_admin') {
      // Get or create the super admin company
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('name', 'Super Admin Company')
        .single()

      if (companyError) {
        console.log('Super Admin company not found, creating one...')
        const { data: newCompany, error: newCompanyError } = await supabaseAdmin
          .from('companies')
          .insert({
            name: 'Super Admin Company',
            status: 'active'
          })
          .select('id')
          .single()

        if (newCompanyError) {
          console.error('Error creating Super Admin company:', newCompanyError)
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          return new Response(
            JSON.stringify({ error: 'Failed to create Super Admin company' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        companyId = newCompany.id
      } else {
        companyId = company.id
      }
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: authUser.user.id,
        company_id: companyId,
        role: userRole,
        first_name: firstName || (userRole === 'super_admin' ? 'Super' : 'Admin'),
        last_name: lastName || (userRole === 'super_admin' ? 'Admin' : 'User'),
        pending_approval: false
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User profile created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authUser.user,
        profile: profile,
        message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user created successfully` 
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
