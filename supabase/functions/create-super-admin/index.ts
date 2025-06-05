
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

    const { email, password, firstName, lastName, companyId } = await req.json()

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set default names if not provided
    const defaultFirstName = firstName || 'Super'
    const defaultLastName = lastName || 'Admin'

    console.log('Creating user account for:', email)

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers.users.find(user => user.email === email)

    if (userExists) {
      console.log('User already exists, checking profile...')
      
      // Check if user profile exists
      const { data: profile, error: profileCheckError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userExists.id)
        .single()

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', profileCheckError)
        return new Response(
          JSON.stringify({ error: 'Failed to check existing user profile' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (profile) {
        // Profile exists, update it if needed
        const { data: updatedProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            first_name: defaultFirstName,
            last_name: defaultLastName,
            company_id: companyId || profile.company_id,
            role: companyId ? 'admin' : 'super_admin',
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
            message: 'User already exists, profile updated',
            status: 200
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        // User exists but no profile, create profile
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            user_id: userExists.id,
            company_id: companyId,
            role: companyId ? 'admin' : 'super_admin',
            first_name: defaultFirstName,
            last_name: defaultLastName,
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
            message: 'Profile created for existing user',
            status: 201
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Determine if this is a super admin (Thalys) or regular admin
    const userRole = email.includes('thalyslopesdev') ? 'super_admin' : 'admin'
    let finalCompanyId = companyId

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
          return new Response(
            JSON.stringify({ error: 'Failed to create Super Admin company' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        finalCompanyId = newCompany.id
      } else {
        finalCompanyId = company.id
      }
    }

    // Create new user with Admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        role: userRole,
        first_name: defaultFirstName,
        last_name: defaultLastName
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

    if (!authUser.user?.id) {
      console.error('No user ID returned from auth creation')
      return new Response(
        JSON.stringify({ error: 'Failed to create user - no ID returned' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created successfully:', authUser.user?.email)

    // Check if user profile already exists (defensive check)
    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single()

    if (existingProfileError && existingProfileError.code !== 'PGRST116') {
      console.error('Error checking for existing profile:', existingProfileError)
      // Continue with creation attempt anyway
    }

    if (existingProfile) {
      console.log('Profile already exists for new user, updating...')
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          company_id: finalCompanyId,
          role: userRole,
          first_name: defaultFirstName,
          last_name: defaultLastName,
          pending_approval: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authUser.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating existing profile for new user:', updateError)
        // Clean up the auth user if profile update fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return new Response(
          JSON.stringify({ 
            error: `Failed to update user profile: ${updateError.message}`,
            details: updateError
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authUser.user,
          profile: updatedProfile,
          message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user created with updated profile`,
          status: 200
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user profile with proper validation
    const profileData = {
      user_id: authUser.user.id,
      company_id: finalCompanyId,
      role: userRole,
      first_name: defaultFirstName,
      last_name: defaultLastName,
      pending_approval: false
    }

    console.log('Creating profile with data:', profileData)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user profile: ${profileError.message}`,
          details: profileError
        }),
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
        message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user created successfully`,
        status: 201
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
