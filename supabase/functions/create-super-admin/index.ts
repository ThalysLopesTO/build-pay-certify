
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { CreateSuperAdminRequest } from './types.ts'
import { validateRequest, getDefaultNames, determineUserRole } from './validation.ts'
import { getOrCreateSuperAdminCompany } from './company-service.ts'
import { 
  findExistingUser, 
  createAuthUser, 
  checkExistingProfile, 
  updateUserProfile, 
  createUserProfile 
} from './user-service.ts'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  createOptionsResponse 
} from './response-helpers.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return createOptionsResponse()
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

    const body: CreateSuperAdminRequest = await req.json()

    // Validate required fields
    const validation = validateRequest(body)
    if (!validation.isValid) {
      return createErrorResponse(validation.errors[0])
    }

    const { email, password, firstName, lastName, companyId } = body

    // Set default names if not provided
    const { defaultFirstName, defaultLastName } = getDefaultNames(firstName, lastName)

    console.log('Creating user account for:', email)

    // Check if user already exists
    const userExists = await findExistingUser(supabaseAdmin, email)

    if (userExists) {
      console.log('User already exists, checking profile...')
      
      const profile = await checkExistingProfile(supabaseAdmin, userExists.id)

      if (profile) {
        // Profile exists, update it if needed
        const updatedProfile = await updateUserProfile(
          supabaseAdmin, 
          userExists.id, 
          companyId || profile.company_id, 
          companyId ? 'admin' : 'super_admin', 
          defaultFirstName, 
          defaultLastName
        )

        return createSuccessResponse({
          success: true, 
          user: userExists,
          profile: updatedProfile,
          message: 'User already exists, profile updated',
          status: 200
        })
      } else {
        // User exists but no profile, create profile
        const newProfile = await createUserProfile(supabaseAdmin, {
          user_id: userExists.id,
          company_id: companyId || '',
          role: companyId ? 'admin' : 'super_admin',
          first_name: defaultFirstName,
          last_name: defaultLastName,
          pending_approval: false
        })

        return createSuccessResponse({
          success: true, 
          user: userExists,
          profile: newProfile,
          message: 'Profile created for existing user',
          status: 201
        })
      }
    }

    // Determine if this is a super admin (Thalys) or regular admin
    const userRole = determineUserRole(email)
    let finalCompanyId = companyId

    if (userRole === 'super_admin') {
      finalCompanyId = await getOrCreateSuperAdminCompany(supabaseAdmin)
    }

    // Create new user with Admin API
    const authUser = await createAuthUser(supabaseAdmin, email, password, userRole, defaultFirstName, defaultLastName)

    console.log('Auth user created successfully:', authUser.user?.email)

    // Check if user profile already exists (defensive check)
    const existingProfile = await checkExistingProfile(supabaseAdmin, authUser.user.id)

    if (existingProfile) {
      console.log('Profile already exists for new user, updating...')
      try {
        const updatedProfile = await updateUserProfile(
          supabaseAdmin, 
          authUser.user.id, 
          finalCompanyId!, 
          userRole, 
          defaultFirstName, 
          defaultLastName
        )

        return createSuccessResponse({
          success: true, 
          user: authUser.user,
          profile: updatedProfile,
          message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user created with updated profile`,
          status: 200
        })
      } catch (error) {
        // Clean up the auth user if profile update fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        throw error
      }
    }

    // Create user profile with proper validation
    const profileData = {
      user_id: authUser.user.id,
      company_id: finalCompanyId!,
      role: userRole,
      first_name: defaultFirstName,
      last_name: defaultLastName,
      pending_approval: false
    }

    try {
      const profile = await createUserProfile(supabaseAdmin, profileData)

      console.log('User profile created successfully')

      return createSuccessResponse({
        success: true, 
        user: authUser.user,
        profile: profile,
        message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user created successfully`,
        status: 201
      })
    } catch (error) {
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw error
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
