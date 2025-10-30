
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Helper function to create company-branded welcome email HTML
const createCompanyBrandedWelcomeEmail = (
  employeeName: string,
  employeeEmail: string,
  temporaryPassword: string,
  companyName: string,
  companyLogoUrl: string | null,
  companyEmail: string | null
) => {
  return `
  <div style="background-color:#f8f9fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#333;margin:0;padding:0;">
    <div style="max-width:600px;margin:40px auto;background-color:#fff;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header with Company Logo -->
      <div style="text-align:center;padding:30px 20px 10px 20px;">
        ${companyLogoUrl 
          ? `<img src="${companyLogoUrl}" alt="${companyName} Logo" style="max-width:140px;border-radius:8px;" />`
          : `<h2 style="margin:0;color:#10b981;font-size:24px;">${companyName}</h2>`
        }
      </div>
      
      <div style="padding:30px 40px;text-align:left;line-height:1.6;">
        <h1 style="font-size:22px;color:#0f172a;">Welcome to ${companyName} 🎉</h1>
        
        <p>Hi <strong>${employeeName}</strong>,</p>
        
        <p>
          You've just been added to the <strong>${companyName}</strong> account on
          <strong>StackBuild</strong> — our construction management platform designed to simplify timesheets, jobsite communication, and project tracking.
        </p>

        <p>Here are your login details to get started:</p>

        <div style="background-color:#f3f4f6;border-radius:8px;padding:15px;margin:20px 0;font-family:monospace;">
          📧 <strong>Email:</strong> ${employeeEmail}<br />
          🔑 <strong>Temporary Password:</strong> ${temporaryPassword}
        </div>

        <p>
          👉 To access your account, visit
          <a href="https://app.stackbuild.ca" target="_blank" style="color:#10b981;font-weight:bold;">app.stackbuild.ca</a>,
          log in using the credentials above, and then go to
          <strong>Settings → Profile → Change Password</strong> to update your password for security.
        </p>

        <div style="text-align:center;margin:25px 0;">
          <a href="https://app.stackbuild.ca" target="_blank" style="display:inline-block;background-color:#10b981;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
            Access Your Account
          </a>
        </div>

        <p>
          Once logged in, you'll be able to:
        </p>
        <ul style="margin:10px 0 20px 20px;">
          <li>View your assigned jobs and sites 🏗️</li>
          <li>Submit and track your daily hours ⏱️</li>
          <li>Access company rules and handbooks 📋</li>
          <li>Receive notifications and updates in real time 📲</li>
        </ul>

        <p>
          If you have any questions or need help accessing your account, please contact your company administrator${companyEmail ? ` or reach out to <a href="mailto:${companyEmail}" style="color:#10b981;text-decoration:none;">${companyEmail}</a>` : ''}.
        </p>

        <p>Welcome aboard — let's build smarter together! 🧱</p>

        <p><strong>— The ${companyName} Team</strong></p>
      </div>

      <div style="text-align:center;font-size:12px;color:#777;padding:25px;background-color:#f8f9fb;">
        © ${new Date().getFullYear()} ${companyName}<br />
        <span style="font-size:11px;color:#999;">This email was sent via StackBuild</span>
      </div>
    </div>
  </div>
  `;
}

// Helper function to send welcome email
const sendEmployeeWelcomeEmail = async (params: {
  email: string
  firstName: string
  lastName: string
  password: string
  companyName: string
  companyLogoUrl: string | null
  companyEmail: string | null
}) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY not configured, skipping welcome email')
    return
  }

  const resend = new Resend(resendApiKey)
  const employeeName = `${params.firstName} ${params.lastName}`.trim() || 'there'
  
  const html = createCompanyBrandedWelcomeEmail(
    employeeName,
    params.email,
    params.password,
    params.companyName,
    params.companyLogoUrl,
    params.companyEmail
  )

  try {
    const { error } = await resend.emails.send({
      from: 'StackBuild <onboarding@resend.dev>',
      to: [params.email],
      subject: `Welcome to ${params.companyName} - Your StackBuild Account is Ready! 🎉`,
      html,
    })

    if (error) {
      console.error('❌ Failed to send welcome email:', error)
      throw error
    }

    console.log('✅ Welcome email sent successfully to:', params.email)
  } catch (error) {
    console.error('❌ Error sending welcome email (non-blocking):', error)
    // Don't throw - this is non-blocking
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Employee creation request received')
    console.log('📋 Request method:', req.method)
    console.log('📍 Request URL:', req.url)

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

    // Create client for getting auth header for permission checking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authorization required' 
        }),
        {
          headers: corsHeaders,
          status: 401,
        },
      )
    }

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Invalid authorization token:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid authorization token' 
        }),
        {
          headers: corsHeaders,
          status: 401,
        },
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Get the request data first
    let employeeData
    try {
      const requestBody = await req.json()
      console.log('📦 Request body keys:', Object.keys(requestBody))
      employeeData = requestBody.employeeData
      
      if (!employeeData) {
        console.error('❌ Missing employeeData in request body')
        console.log('📋 Available keys in request:', Object.keys(requestBody))
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Missing employee data in request' 
          }),
          {
            headers: corsHeaders,
            status: 400,
          },
        )
      }
      
      console.log('📊 Employee data received:', {
        email: employeeData.email,
        role: employeeData.role,
        companyId: employeeData.companyId,
        hasPhoto: !!employeeData.photoUrl,
        hasCertificates: employeeData.certificates?.length > 0
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
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

    // Check user's role and company
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Failed to get user profile:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User profile not found' 
        }),
        {
          headers: corsHeaders,
          status: 403,
        },
      )
    }

    // Check if user has permission to create employees (admin, management, or foreman)
    const allowedRoles = ['admin', 'super_admin', 'management', 'foreman']
    if (!allowedRoles.includes(profile.role)) {
      console.error('User does not have permission to create employees:', profile.role)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Insufficient permissions. Only admins, management, and foremen can create employees.' 
        }),
        {
          headers: corsHeaders,
          status: 403,
        },
      )
    }

    // Validate role assignment permissions
    const isValidRoleAssignment = () => {
      switch (profile.role) {
        case 'foreman':
          return employeeData.role === 'employee';
        case 'management':
          return ['employee', 'foreman'].includes(employeeData.role);
        case 'admin':
        case 'super_admin':
          return ['employee', 'foreman', 'management', 'admin'].includes(employeeData.role);
        default:
          return false;
      }
    };

    if (!isValidRoleAssignment()) {
      console.error(`User with role ${profile.role} cannot assign role ${employeeData.role}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `You don't have permission to assign the role "${employeeData.role}". Your role (${profile.role}) can only assign specific roles.` 
        }),
        {
          headers: corsHeaders,
          status: 403,
        },
      )
    }

    // Ensure the employee is being created for the same company
    if (employeeData.companyId !== profile.company_id) {
      console.error('User attempting to create employee for different company')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'You can only create employees for your own company' 
        }),
        {
          headers: corsHeaders,
          status: 403,
        },
      )
    }

    console.log(`✅ User ${user.email} (${profile.role}) creating employee for company ${profile.company_id}`)

    console.log('👤 Creating employee with data:', { 
      email: employeeData.email, 
      role: employeeData.role, 
      companyId: employeeData.companyId,
      hasPhoto: !!employeeData.photoUrl,
      photoUrl: employeeData.photoUrl,
      hourlyRate: employeeData.hourlyRate,
      trade: employeeData.trade,
      position: employeeData.position,
      phoneNumber: employeeData.phoneNumber,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName
    })

    // First, check if the company can add more employees
    const { data: canAdd, error: checkError } = await supabaseAdmin
      .rpc('can_add_employee', { company_id_param: employeeData.companyId })

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
      console.log('Employee limit reached for company:', employeeData.companyId)
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
    const emailExists = existingUser.users.some(user => user.email === employeeData.email)
    if (emailExists) {
      console.log('User with email already exists:', employeeData.email)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `An account with email ${employeeData.email} already exists. Please use a different email address.` 
        }),
        {
          headers: corsHeaders,
          status: 400,
        },
      )
    }

    // Create the user account with admin privileges
    const { data: authData, error: userCreationError } = await supabaseAdmin.auth.admin.createUser({
      email: employeeData.email,
      password: employeeData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: employeeData.username,
        first_name: employeeData.firstName,
        last_name: employeeData.lastName,
        address: employeeData.address,
        phone_number: employeeData.phoneNumber,
        role: employeeData.role,
        trade: employeeData.trade,
        hourly_rate: employeeData.hourlyRate,
        company_id: employeeData.companyId, // Ensure company_id is in metadata
        must_change_password: true, // Force password change on first login
      },
    })

    if (userCreationError) {
      console.error('Error creating user:', userCreationError)
      
      // Check if error is due to email already existing
      if (userCreationError.message?.includes('already been registered') || 
          userCreationError.message?.includes('email address has already been registered') ||
          userCreationError.status === 422) {
        
        console.log('Email already exists in auth, checking profile status...')
        
        // Check if this is an orphaned auth user (exists in auth but not in user_profiles)
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('user_id, is_active, email, first_name, last_name')
          .eq('email', employeeData.email)
          .maybeSingle()
        
        if (profileCheckError) {
          console.error('Error checking profile:', profileCheckError)
        }
        
        if (!existingProfile) {
          // Orphaned auth user - exists in auth.users but not in user_profiles
          console.warn('⚠️ ORPHANED AUTH USER detected:', employeeData.email)
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `This email (${employeeData.email}) has an existing login account but no employee profile. This is a data inconsistency issue. Please contact your system administrator to resolve this, or use a different email address.`,
              errorCode: 'ORPHANED_AUTH_USER',
              email: employeeData.email
            }),
            {
              headers: corsHeaders,
              status: 400,
            },
          )
        } else if (!existingProfile.is_active) {
          // Profile exists but is archived - suggest reactivation
          console.log('📦 Archived employee found:', existingProfile.email)
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `An employee with email ${employeeData.email} (${existingProfile.first_name} ${existingProfile.last_name}) already exists but is archived. Please go to Employee Management and reactivate this employee instead of creating a new one.`,
              errorCode: 'ARCHIVED_EMPLOYEE_EXISTS',
              existingUserId: existingProfile.user_id,
              employeeName: `${existingProfile.first_name} ${existingProfile.last_name}`
            }),
            {
              headers: corsHeaders,
              status: 400,
            },
          )
        } else {
          // Profile exists and is active
          console.log('✅ Active employee already exists:', existingProfile.email)
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `An active employee with email ${employeeData.email} (${existingProfile.first_name} ${existingProfile.last_name}) already exists in the system. Please use a different email address.`,
              errorCode: 'ACTIVE_EMPLOYEE_EXISTS',
              employeeName: `${existingProfile.first_name} ${existingProfile.last_name}`
            }),
            {
              headers: corsHeaders,
              status: 400,
            },
          )
        }
      }
      
      // Generic error for other cases
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create user account: ' + userCreationError.message
        }),
        {
          headers: corsHeaders,
          status: 400,
        },
      )
    }

    console.log('✅ User created successfully:', authData.user?.email)
    console.log('🆔 New user ID:', authData.user?.id)

    // Set default tax rates for payroll employees
    const defaultRates = employeeData.workerType === 'employee' ? {
      income_tax_rate: 12.00,
      cpp_rate: 5.95,
      ei_rate: 1.63
    } : {};

    // Prepare profile data with detailed logging
    const profileData = {
      user_id: authData.user.id,
      company_id: employeeData.companyId,
      email: employeeData.email,
      first_name: employeeData.firstName,
      last_name: employeeData.lastName,
      role: employeeData.role,
      trade: employeeData.trade || 'General',
      position: employeeData.position || 'Worker',
      hourly_rate: parseFloat(employeeData.hourlyRate) || null,
      photo_url: employeeData.photoUrl || null,
      phone: employeeData.phoneNumber || null,
      pending_approval: false,
      worker_type: employeeData.workerType || 'subcontractor',
      is_active: true, // Ensure new employees are active by default
      ...defaultRates
    }
    
    console.log('Creating/updating profile with data:', {
      ...profileData,
      hourly_rate_original: employeeData.hourlyRate,
      hourly_rate_parsed: parseFloat(employeeData.hourlyRate),
      photo_url_original: employeeData.photoUrl
    })

    // Use UPSERT to handle the case where trigger already created a basic profile
    const { data: profileData_result, error: upsertProfileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profileData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()

    if (upsertProfileError) {
      console.error('Error creating/updating user profile:', upsertProfileError)
      console.error('Profile data that failed:', JSON.stringify(profileData, null, 2))
      
      // Try to delete the auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        console.log('Cleaned up auth user after profile creation failure')
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to create/update user profile: ${upsertProfileError.message}`,
          details: upsertProfileError
        }),
        {
          headers: corsHeaders,
          status: 500,
        },
      )
    }

    console.log('✅ Profile created/updated successfully:', profileData_result?.[0] || 'No data returned')
    console.log('🏢 User profile processed successfully for company:', employeeData.companyId)

    // Create certificates if provided
    if (employeeData.certificates && employeeData.certificates.length > 0) {
      console.log('Creating certificates for employee:', authData.user.id)
      
      for (const certificate of employeeData.certificates) {
        // Only insert if certificate has expiry date when noExpiry is false
        if (!certificate.noExpiry && certificate.expiryDate) {
          const { error: certError } = await supabaseAdmin
            .from('employee_certificates')
            .insert({
              employee_id: authData.user.id,
              company_id: employeeData.companyId,
              certificate_name: certificate.name,
              certificate_type: 'custom',
              expiry_date: certificate.expiryDate,
              file_url: certificate.fileUrl,
              uploaded_by: authData.user.id,
              status: 'valid'
            })

          if (certError) {
            console.error('Error creating certificate:', certError)
            // Don't fail the entire process for certificate errors, just log
          }
        } else if (certificate.noExpiry) {
          // For certificates with no expiry, set expiry_date far in the future and mark as no-expiry
          const farFutureDate = new Date('2099-12-31').toISOString().split('T')[0]
          
          const { error: certError } = await supabaseAdmin
            .from('employee_certificates')
            .insert({
              employee_id: authData.user.id,
              company_id: employeeData.companyId,
              certificate_name: certificate.name,
              certificate_type: 'no-expiry',
              expiry_date: farFutureDate,
              file_url: certificate.fileUrl,
              uploaded_by: authData.user.id,
              status: 'valid'
            })

          if (certError) {
            console.error('Error creating no-expiry certificate:', certError)
            // Don't fail the entire process for certificate errors, just log
          }
        }
      }
      
      console.log('Certificates processed successfully')
    }

    console.log('🎉 Employee creation completed successfully!')
    
    // Fetch company settings for branded email
    try {
      const { data: companySettings } = await supabaseAdmin
        .from('company_settings')
        .select('company_name, company_logo_url, company_email')
        .eq('company_id', employeeData.companyId)
        .single()

      const companyName = companySettings?.company_name || 'Your Company'
      const companyLogoUrl = companySettings?.company_logo_url || null
      const companyEmail = companySettings?.company_email || null

      console.log('📧 Sending welcome email to:', employeeData.email)
      
      // Send welcome email (non-blocking)
      await sendEmployeeWelcomeEmail({
        email: employeeData.email,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        password: employeeData.password,
        companyName,
        companyLogoUrl,
        companyEmail,
      })
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email (non-blocking):', emailError)
      // Don't fail employee creation if email fails
    }
    
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
    console.error('💥 Unexpected error in create-employee function:', error)
    console.error('🔍 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 500)
    })
    
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
