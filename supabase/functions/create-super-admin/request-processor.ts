
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

  // Check if user already exists
  const existingUser = await findExistingUser(supabaseAdmin, email)

  if (existingUser) {
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
  return await handleNewUser(
    supabaseAdmin, 
    email, 
    password, 
    companyId, 
    defaultFirstName, 
    defaultLastName, 
    companyName
  )
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
        await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
      }

      return {
        success: true, 
        user: existingUser,
        profile: updatedProfile,
        message: 'User profile updated with admin role and company assignment',
        status: 200
      }
    }

    // User and profile exist with correct assignment - return success
    return {
      success: true, 
      user: existingUser,
      profile: existingProfile,
      message: 'User and profile already exist with correct assignment',
      status: 200
    }
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
      await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
    }

    return {
      success: true, 
      user: existingUser,
      profile: newProfile,
      message: 'Profile created for existing user',
      status: 201
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

  // Check if profile already exists (defensive check)
  const existingProfile = await checkExistingProfile(supabaseAdmin, authUser.user.id)

  if (existingProfile) {
    console.log('Profile already exists for user, checking if update is needed...')
    
    // Check if profile needs updating
    if (companyId && (existingProfile.company_id !== companyId || existingProfile.role !== userRole)) {
      console.log('Updating existing profile with correct company and role...')
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
          await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
        }

        return {
          success: true, 
          user: authUser.user,
          profile: updatedProfile,
          message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user updated with correct profile`,
          status: 200
        }
      } catch (error) {
        console.error('Profile update failed:', error)
        throw error
      }
    } else {
      // Profile exists and is correct, return success
      console.log('Profile already exists with correct assignment')
      return {
        success: true, 
        user: authUser.user,
        profile: existingProfile,
        message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user and profile already exist`,
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

  try {
    const profile = await createUserProfile(supabaseAdmin, profileData)

    console.log('User profile created successfully')

    // Send welcome email for new admin users only
    if (userRole === 'admin' && companyId) {
      await sendWelcomeEmailSafely(email, defaultFirstName, defaultLastName, companyName)
    }

    return {
      success: true, 
      user: authUser.user,
      profile: profile,
      message: `${userRole === 'super_admin' ? 'Super Admin' : 'Admin'} user created successfully`,
      status: 201
    }
  } catch (error) {
    console.error('Profile creation failed:', error)
    // Only clean up the auth user if we just created it and profile creation failed
    if (!existingProfile) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('Cleaned up auth user after profile creation failure')
      } catch (cleanupError) {
        console.error('Failed to clean up auth user:', cleanupError)
      }
    }
    throw error
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
