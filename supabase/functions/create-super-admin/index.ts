
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
        console.log('User and profile both exist, checking company assignment...')
        
        // Check if user is assigned to the correct company with admin role
        if (companyId && (existingProfile.company_id !== companyId || existingProfile.role !== 'admin')) {
          console.log('Updating profile with correct company and admin role...')
          
          const updatedProfile = await updateUserProfile(
            supabaseAdmin, 
            existingUser.id, 
            companyId, 
            'admin', 
            defaultFirstName, 
            defaultLastName
          )

          // Send welcome email for new admin assignment
          if (companyId) {
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
            profile: updatedProfile,
            message: 'User profile updated with admin role and company assignment',
            status: 200
          })
        }

        // User and profile exist with correct assignment - return success
        return createSuccessResponse({
          success: true, 
          user: existingUser,
          profile: existingProfile,
          message: 'User and profile already exist with correct assignment',
          status: 200
        })
      } else {
        // User exists but no profile, create profile
        console.log('User exists but no profile found, creating profile...')
        
        // Determine user role and company
        const userRole = companyId ? 'admin' : determineUserRole(email)
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
    const userRole = companyId ? 'admin' : determineUserRole(email)
    let finalCompanyId = companyId

    if (userRole === 'super_admin' && !companyId) {
      finalCompanyId = await getOrCreateSuperAdminCompany(supabaseAdmin)
    }

    // Create new user with Admin API
    let authUser
    try {
      authUser = await createAuthUser(supabaseAdmin, email, password, userRole, defaultFirstName, defaultLastName)
      console.log('Auth user created successfully:', authUser.user?.email)
    } catch (authError) {
      console.error('Auth user creation failed:', authError)
      // If user creation fails due to existing email, try to find the existing user
      if (authError.message?.includes('already been registered')) {
        console.log('User already exists, attempting to find existing user...')
        const existingUser = await findExistingUser(supabaseAdmin, email)
        if (existingUser) {
          authUser = { user: existingUser }
          console.log('Found existing user, proceeding with profile creation/update')
        } else {
          throw new Error('User creation failed and could not find existing user')
        }
      } else {
        throw authError
      }
    }

    // Double-check if profile was created by trigger (defensive check)
    const existingProfile = await checkExistingProfile(supabaseAdmin, authUser.user.id)

    if (existingProfile) {
      console.log('Profile already exists for user (created by trigger), updating...')
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
        console.error('Profile update failed:', error)
        // Don't clean up the auth user if it already existed
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
      console.error('Profile creation failed:', error)
      // Only clean up the auth user if we just created it (not if it already existed)
      if (!existingUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          console.log('Cleaned up auth user after profile creation failure')
        } catch (cleanupError) {
          console.error('Failed to clean up auth user:', cleanupError)
        }
      }
      throw error
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
