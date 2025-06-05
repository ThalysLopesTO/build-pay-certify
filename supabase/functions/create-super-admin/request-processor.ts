
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
import { sendWelcomeEmail } from './email-service.ts'

export async function processCreateSuperAdminRequest(
  supabaseAdmin: any, 
  body: CreateSuperAdminRequest
) {
  // Validate required fields
  const validation = validateRequest(body)
  if (!validation.isValid) {
    throw new Error(validation.errors[0])
  }

  const { email, password, firstName, lastName, companyId, companyName } = body

  // Set default names if not provided
  const { defaultFirstName, defaultLastName } = getDefaultNames(firstName, lastName)

  console.log('Processing user account for:', email)

  try {
    // Check if user already exists
    const existingUser = await findExistingUser(supabaseAdmin, email)

    if (existingUser) {
      console.log('User already exists, processing existing user...')
      return await handleExistingUser(
        supabaseAdmin, 
        existingUser, 
        companyId, 
        defaultFirstName, 
        defaultLastName, 
        email, 
        companyName
      )
    }

    // User doesn't exist, create new user
    console.log('User does not exist, creating new user...')
    return await handleNewUser(
      supabaseAdmin, 
      email, 
      password, 
      companyId, 
      defaultFirstName, 
      defaultLastName, 
      companyName
    )
  } catch (error) {
    console.error('Error in processCreateSuperAdminRequest:', error)
    
    // Return a structured error response instead of throwing
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      message: 'Failed to process user creation request',
      status: 500
    }
  }
}

async function handleExistingUser(
  supabaseAdmin: any,
  existingUser: any,
  companyId: string | undefined,
  defaultFirstName: string,
  defaultLastName: string,
  email: string,
  companyName: string | undefined
) {
  try {
    console.log('Checking existing user profile...')
    
    const existingProfile = await checkExistingProfile(supabaseAdmin, existingUser.id)

    // Determine user role and company
    const userRole = companyId ? 'admin' : determineUserRole(email)
    let finalCompanyId = companyId

    if (userRole === 'super_admin' && !companyId) {
      finalCompanyId = await getOrCreateSuperAdminCompany(supabaseAdmin)
    }

    if (existingProfile) {
      console.log('Profile exists, checking if update is needed...')
      
      // Check if profile needs updating
      const needsUpdate = finalCompanyId && (
        existingProfile.company_id !== finalCompanyId || 
        existingProfile.role !== userRole
      )

      if (needsUpdate) {
        console.log('Updating existing profile with correct company and role...')
        
        const updatedProfile = await updateUserProfile(
          supabaseAdmin, 
          existingUser.id, 
          finalCompanyId!, 
          userRole, 
          defaultFirstName, 
          defaultLastName
        )

        // Send welcome email for admin users only
        if (userRole === 'admin' && companyId) {
          await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
        }

        // Update registration request as approved
        if (companyId) {
          await updateRegistrationRequestStatus(supabaseAdmin, companyId, 'approved')
        }

        return {
          success: true, 
          user: existingUser,
          profile: updatedProfile,
          message: 'Admin user updated successfully',
          status: 200
        }
      } else {
        // Profile exists and is correct
        console.log('Profile already exists with correct assignment')
        
        // Update registration request as approved
        if (companyId) {
          await updateRegistrationRequestStatus(supabaseAdmin, companyId, 'approved')
        }

        return {
          success: true, 
          user: existingUser,
          profile: existingProfile,
          message: 'Admin user already exists with correct configuration',
          status: 200
        }
      }
    } else {
      // User exists but no profile, create profile
      console.log('User exists but no profile found, creating profile...')
      
      const newProfile = await createUserProfile(supabaseAdmin, {
        user_id: existingUser.id,
        company_id: finalCompanyId || '',
        role: userRole,
        first_name: defaultFirstName,
        last_name: defaultLastName,
        pending_approval: false
      })

      // Send welcome email for admin users only
      if (userRole === 'admin' && companyId) {
        await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
      }

      // Update registration request as approved
      if (companyId) {
        await updateRegistrationRequestStatus(supabaseAdmin, companyId, 'approved')
      }

      return {
        success: true, 
        user: existingUser,
        profile: newProfile,
        message: 'Admin user created successfully',
        status: 201
      }
    }
  } catch (error) {
    console.error('Error handling existing user:', error)
    return {
      success: false,
      error: error.message || 'Failed to handle existing user',
      message: 'Error processing existing user',
      status: 500
    }
  }
}

async function handleNewUser(
  supabaseAdmin: any,
  email: string,
  password: string,
  companyId: string | undefined,
  defaultFirstName: string,
  defaultLastName: string,
  companyName: string | undefined
) {
  try {
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
          // Recursively handle as existing user
          return await handleExistingUser(
            supabaseAdmin, 
            existingUser, 
            companyId, 
            defaultFirstName, 
            defaultLastName, 
            email, 
            companyName
          )
        } else {
          throw new Error('User exists but could not be found by email')
        }
      } else {
        throw authError
      }
    }

    // Check if profile already exists (defensive check)
    const existingProfile = await checkExistingProfile(supabaseAdmin, authUser.user.id)

    if (existingProfile) {
      console.log('Profile already exists for user, checking if update is needed...')
      
      // Check if profile needs updating
      if (companyId && (existingProfile.company_id !== companyId || existingProfile.role !== userRole)) {
        console.log('Updating existing profile with correct company and role...')
        
        const updatedProfile = await updateUserProfile(
          supabaseAdmin, 
          authUser.user.id, 
          finalCompanyId!, 
          userRole, 
          defaultFirstName, 
          defaultLastName
        )

        // Send welcome email for admin users only
        if (userRole === 'admin' && companyId) {
          await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
        }

        // Update registration request as approved
        if (companyId) {
          await updateRegistrationRequestStatus(supabaseAdmin, companyId, 'approved')
        }

        return {
          success: true, 
          user: authUser.user,
          profile: updatedProfile,
          message: 'Admin user updated with correct profile',
          status: 200
        }
      } else {
        // Profile exists and is correct, return success
        console.log('Profile already exists with correct assignment')
        
        // Update registration request as approved
        if (companyId) {
          await updateRegistrationRequestStatus(supabaseAdmin, companyId, 'approved')
        }

        return {
          success: true, 
          user: authUser.user,
          profile: existingProfile,
          message: 'Admin user and profile already exist',
          status: 200
        }
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

    const profile = await createUserProfile(supabaseAdmin, profileData)
    console.log('User profile created successfully')

    // Send welcome email for admin users only
    if (userRole === 'admin' && companyId) {
      await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
    }

    // Update registration request as approved
    if (companyId) {
      await updateRegistrationRequestStatus(supabaseAdmin, companyId, 'approved')
    }

    return {
      success: true, 
      user: authUser.user,
      profile: profile,
      message: 'Admin user created successfully',
      status: 201
    }
  } catch (error) {
    console.error('Error handling new user:', error)
    return {
      success: false,
      error: error.message || 'Failed to create new user',
      message: 'Error creating new user',
      status: 500
    }
  }
}

async function sendWelcomeEmailSafely(
  email: string,
  firstName: string,
  lastName: string,
  companyName?: string
) {
  try {
    await sendWelcomeEmail(email, firstName, lastName, companyName || 'Your Company')
    console.log('Welcome email sent successfully')
  } catch (emailError) {
    console.error('Failed to send welcome email, but continuing:', emailError)
  }
}

async function updateRegistrationRequestStatus(
  supabaseAdmin: any,
  companyId: string,
  status: string
) {
  try {
    const { error } = await supabaseAdmin
      .from('company_registration_requests')
      .update({ 
        status: status,
        approved_at: new Date().toISOString()
      })
      .eq('company_id', companyId)

    if (error) {
      console.error('Failed to update registration request status:', error)
    } else {
      console.log('Registration request status updated to:', status)
    }
  } catch (error) {
    console.error('Error updating registration request status:', error)
  }
}
