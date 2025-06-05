
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
import { sendWelcomeEmail } from './email-service.ts'

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

    const { email, password, firstName, lastName, companyId, companyName } = body

    // Set default names if not provided
    const { defaultFirstName, defaultLastName } = getDefaultNames(firstName, lastName)

    console.log('Processing user account for:', email)

    // Check if user already exists
    const existingUser = await findExistingUser(supabaseAdmin, email)

    if (existingUser) {
      console.log('User already exists, checking profile...')
      
      const existingProfile = await checkExistingProfile(supabaseAdmin, existingUser.id)

      if (existingProfile) {
        // Both user and profile exist - return success without changes
        console.log('User and profile both exist, returning success')
        return createSuccessResponse({
          success: true, 
          user: existingUser,
          profile: existingProfile,
          message: 'User and profile already exist',
          status: 200
        })
      } else {
        // User exists but no profile, create profile
        console.log('User exists but no profile found, creating profile...')
        
        // Determine user role and company
        const userRole = determineUserRole(email)
        let finalCompanyId = companyId

        if (userRole === 'super_admin' && !companyId) {
          finalCompanyId = await getOrCreateSuperAdminCompany(supabaseAdmin)
        }

        const newProfile = await createUserProfile(supabaseAdmin, {
          user_id: existingUser.id,
          company_id: finalCompanyId || '',
          role: userRole,
          first_name: defaultFirstName,
          last_name: defaultLastName,
          pending_approval: false
        })

        // Send welcome email for new admin profiles only
        if (userRole === 'admin' && companyId) {
          try {
            await sendWelcomeEmail(email, defaultFirstName, defaultLastName, companyName || 'Your Company')
            console.log('Welcome email sent successfully')
          } catch (emailError) {
            console.error('Failed to send welcome email, but continuing:', emailError)
          }
        }

        return createSuccessResponse({
          success: true, 
          user: existingUser,
          profile: newProfile,
          message: 'Profile created for existing user',
          status: 201
        })
      }
    }

    // User doesn't exist, create new user
    console.log('Creating new user account for:', email)

    // Determine if this is a super admin (Thalys) or regular admin
    const userRole = determineUserRole(email)
    let finalCompanyId = companyId

    if (userRole === 'super_admin' && !companyId) {
      finalCompanyId = await getOrCreateSuperAdminCompany(supabaseAdmin)
    }

    // Create new user with Admin API
    const authUser = await createAuthUser(supabaseAdmin, email, password, userRole, defaultFirstName, defaultLastName)

    console.log('Auth user created successfully:', authUser.user?.email)

    // Double-check if profile was created by trigger (defensive check)
    const existingProfile = await checkExistingProfile(supabaseAdmin, authUser.user.id)

    if (existingProfile) {
      console.log('Profile already exists for new user (created by trigger), updating...')
      try {
        const updatedProfile = await updateUserProfile(
          supabaseAdmin, 
          authUser.user.id, 
          finalCompanyId!, 
          userRole, 
          defaultFirstName, 
          defaultLastName
        )

        // Send welcome email for new admin users only
        if (userRole === 'admin' && companyId) {
          try {
            await sendWelcomeEmail(email, defaultFirstName, defaultLastName, companyName || 'Your Company')
            console.log('Welcome email sent successfully')
          } catch (emailError) {
            console.error('Failed to send welcome email, but continuing:', emailError)
          }
        }

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

    // Create user profile
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

      // Send welcome email for new admin users only
      if (userRole === 'admin' && companyId) {
        try {
          await sendWelcomeEmail(email, defaultFirstName, defaultLastName, companyName || 'Your Company')
          console.log('Welcome email sent successfully')
        } catch (emailError) {
          console.error('Failed to send welcome email, but continuing:', emailError)
        }
      }

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
