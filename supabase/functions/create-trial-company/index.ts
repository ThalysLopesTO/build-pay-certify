import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTrialCompanyRequest {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  trialDays?: number;
  planType?: 'basic' | 'pro';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from a super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'super_admin') {
      console.error('Not a super admin:', profileError);
      return new Response(
        JSON.stringify({ error: 'Access denied: Super admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateTrialCompanyRequest = await req.json();
    
    // Validate required fields
    if (!body.companyName || !body.adminFirstName || !body.adminLastName || !body.adminEmail || !body.adminPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.adminEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength (min 6 characters)
    if (body.adminPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trialDays = body.trialDays || 30;
    const planType = body.planType || 'basic';
    const employeeLimit = planType === 'pro' ? null : 5; // null = unlimited for pro

    console.log('Creating trial company:', { companyName: body.companyName, adminEmail: body.adminEmail, trialDays, planType });

    // Calculate trial dates
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    
    const gracePeriodEndDate = new Date(trialEndDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7);

    // Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: body.companyName,
        email: body.companyEmail || body.adminEmail,
        phone: body.companyPhone,
        address: body.companyAddress,
        trial_end_date: trialEndDate.toISOString(),
        grace_period_end_date: gracePeriodEndDate.toISOString(),
        subscription_status: 'trialing',
        stripe_verified: false,
        subscription_override: true,
        employee_limit: employeeLimit,
        plan_type: planType
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return new Response(
        JSON.stringify({ error: 'Failed to create company', details: companyError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Company created:', company.id);

    // Create admin user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.adminEmail,
      password: body.adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: body.adminFirstName,
        last_name: body.adminLastName,
        company_id: company.id,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      
      // Rollback: Delete company if user creation fails
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create admin user', details: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin user created:', authUser.user.id);

    // Create user profile
    const { error: profileCreateError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: authUser.user.id,
        company_id: company.id,
        role: 'admin',
        first_name: body.adminFirstName,
        last_name: body.adminLastName,
        is_active: true,
        pending_approval: false
      });

    if (profileCreateError) {
      console.error('Error creating user profile:', profileCreateError);
      
      // Rollback: Delete user and company
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile', details: profileCreateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User profile created');

    // Log the creation in company_registration_requests for audit trail
    await supabaseAdmin
      .from('company_registration_requests')
      .insert({
        company_id: company.id,
        company_name: body.companyName,
        admin_email: body.adminEmail,
        admin_first_name: body.adminFirstName,
        admin_last_name: body.adminLastName,
        status: 'approved',
        notes: `Manual trial company creation by super admin. Trial: ${trialDays} days, Plan: ${planType}`,
        stripe_session_id: null,
        payment_verified: false
      });

    // Send welcome email
    try {
      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          to: body.adminEmail,
          subject: `Welcome to StackBuild - ${trialDays} Day Trial Started!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to StackBuild, ${body.adminFirstName}!</h2>
              <p>Your trial account has been created for <strong>${body.companyName}</strong>.</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Trial Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Plan:</strong> ${planType.toUpperCase()}</li>
                  <li><strong>Trial Period:</strong> ${trialDays} days</li>
                  <li><strong>Trial Ends:</strong> ${trialEndDate.toLocaleDateString()}</li>
                  <li><strong>Grace Period Ends:</strong> ${gracePeriodEndDate.toLocaleDateString()}</li>
                  ${employeeLimit ? `<li><strong>Employee Limit:</strong> ${employeeLimit}</li>` : '<li><strong>Employees:</strong> Unlimited</li>'}
                </ul>
              </div>

              <div style="background: #007bff; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <h3 style="margin-top: 0;">Login Credentials</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${body.adminEmail}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> (as provided)</p>
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://stackbuild.lovable.app'}" 
                   style="display: inline-block; margin-top: 15px; padding: 10px 30px; background: white; color: #007bff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Login Now
                </a>
              </div>

              <h3 style="color: #333;">Getting Started:</h3>
              <ol>
                <li>Log in to your account</li>
                <li>Set up your company profile</li>
                <li>Add employees and jobsites</li>
                <li>Start tracking time and managing projects</li>
              </ol>

              <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          `
        }
      });
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trial company created successfully',
        data: {
          companyId: company.id,
          companyName: company.name,
          adminEmail: body.adminEmail,
          adminUserId: authUser.user.id,
          trialEndDate: trialEndDate.toISOString(),
          gracePeriodEndDate: gracePeriodEndDate.toISOString(),
          planType,
          employeeLimit
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
