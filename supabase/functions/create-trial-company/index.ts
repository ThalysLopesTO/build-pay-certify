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
    // Since you only have one plan at $297 with 50 employees, we'll use that
    const employeeLimit = 50;

    console.log('Creating trial company:', { companyName: body.companyName, adminEmail: body.adminEmail, trialDays });

    // Calculate trial dates
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    
    const gracePeriodEndDate = new Date(trialEndDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7);

    // Create company - this is a FREE trial account that won't require payment
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: body.companyName,
        trial_end_date: trialEndDate.toISOString(),
        grace_period_end_date: gracePeriodEndDate.toISOString(),
        subscription_status: 'active', // Set as active so they can use the system
        stripe_verified: false,
        subscription_override: true, // Critical: bypasses all subscription checks
        employee_limit: employeeLimit,
        plan_type: 'enterprise', // Set as enterprise for the full plan
        status: 'active'
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

    // Update user profile to ensure correct activation status
    // (The profile is auto-created by database trigger, we just need to ensure it's active)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        is_active: true,
        pending_approval: false
      })
      .eq('user_id', authUser.user.id);

    if (profileUpdateError) {
      console.error('Error updating user profile:', profileUpdateError);
      
      // Rollback: Delete user and company
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to activate user profile', details: profileUpdateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User profile activated');

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
        notes: `FREE trial company created by super admin. Trial: ${trialDays} days. No payment required.`,
        stripe_session_id: null,
        payment_verified: false
      });

    // Send welcome email
    try {
      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          to: body.adminEmail,
          subject: `Welcome to StackBuild - ${trialDays} Day FREE Trial!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to StackBuild, ${body.adminFirstName}!</h2>
              <p>Your <strong>FREE trial account</strong> has been created for <strong>${body.companyName}</strong>.</p>
              
              <div style="background: #28a745; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">✨ FREE Trial Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Trial Period:</strong> ${trialDays} days</li>
                  <li><strong>Trial Ends:</strong> ${trialEndDate.toLocaleDateString()}</li>
                  <li><strong>Employee Limit:</strong> ${employeeLimit} employees</li>
                  <li><strong>Payment Required:</strong> NO - This is a free trial!</li>
                </ul>
              </div>

              <div style="background: #007bff; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <h3 style="margin-top: 0;">Login Credentials</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${body.adminEmail}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> (as provided during setup)</p>
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://stackbuild.lovable.app'}" 
                   style="display: inline-block; margin-top: 15px; padding: 10px 30px; background: white; color: #007bff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Login Now
                </a>
              </div>

              <h3 style="color: #333;">Getting Started:</h3>
              <ol>
                <li>Log in to your account using the credentials above</li>
                <li>Set up your company profile</li>
                <li>Add employees and jobsites</li>
                <li>Start tracking time and managing projects</li>
              </ol>

              <p><strong>Note:</strong> This is a completely free trial account. You will not be charged or asked to subscribe during the trial period.</p>

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
        message: 'FREE trial company created successfully',
        data: {
          companyId: company.id,
          companyName: company.name,
          adminEmail: body.adminEmail,
          adminUserId: authUser.user.id,
          trialEndDate: trialEndDate.toISOString(),
          gracePeriodEndDate: gracePeriodEndDate.toISOString(),
          employeeLimit,
          isFree: true
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
