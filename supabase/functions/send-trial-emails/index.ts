import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface EmailRequest {
  email_type: 'trial_started' | 'trial_ending' | 'payment_failed';
  company_id: string;
  company_name: string;
  trial_end_date?: string;
  grace_period_end?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      email_type, 
      company_id, 
      company_name,
      trial_end_date,
      grace_period_end 
    }: EmailRequest = await req.json();

    // Get admin email from company
    const { data: adminProfile } = await supabaseClient
      .from('user_profiles')
      .select('user_id')
      .eq('company_id', company_id)
      .eq('role', 'admin')
      .single();

    if (!adminProfile) {
      throw new Error('No admin found for company');
    }

    const { data: { user } } = await supabaseClient.auth.admin.getUserById(adminProfile.user_id);
    
    if (!user?.email) {
      throw new Error('Admin email not found');
    }

    const adminEmail = user.email;
    let subject = '';
    let htmlBody = '';

    switch (email_type) {
      case 'trial_started':
        subject = `Welcome to StackBuild - Your 7-Day Trial Has Started`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Welcome to StackBuild!</h2>
            <p>Dear ${company_name} Team,</p>
            <p>Thank you for starting your <strong>7-day free trial</strong> with StackBuild Pro.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Trial Details</h3>
              <ul style="line-height: 1.8;">
                <li><strong>Trial Period:</strong> 7 Days</li>
                <li><strong>Trial Ends:</strong> ${new Date(trial_end_date!).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                <li><strong>Monthly Price:</strong> $297 CAD</li>
                <li><strong>Payment:</strong> No charge during trial</li>
              </ul>
            </div>

            <p>During your trial, you'll have full access to all StackBuild Pro features:</p>
            <ul style="line-height: 1.8;">
              <li>✅ Unlimited employees</li>
              <li>✅ Payroll & Invoice System</li>
              <li>✅ Certificate & Safety Tracking</li>
              <li>✅ Multi-role Access (Admin, Foreman, Worker)</li>
              <li>✅ Project & Jobsite Control</li>
            </ul>

            <p style="margin-top: 30px;"><strong>What happens next?</strong></p>
            <p>After your 7-day trial ends, your payment method will be automatically charged $297 CAD per month. You can cancel anytime before the trial ends with no charge.</p>

            <p style="margin-top: 30px;">If you have any questions, please don't hesitate to reach out to our support team.</p>
            
            <p style="margin-top: 40px;">Best regards,<br><strong>The StackBuild Team</strong></p>
          </div>
        `;
        break;

      case 'trial_ending':
        const daysUntilEnd = Math.ceil((new Date(trial_end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        subject = `Your StackBuild Trial Ends in ${daysUntilEnd} Days`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Your Trial is Ending Soon</h2>
            <p>Dear ${company_name} Team,</p>
            <p>This is a friendly reminder that your <strong>7-day free trial</strong> of StackBuild Pro will end in <strong>${daysUntilEnd} days</strong>.</p>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Important Information</h3>
              <p style="margin: 0;"><strong>Trial Ends:</strong> ${new Date(trial_end_date!).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 10px 0 0 0;"><strong>After Trial:</strong> $297 CAD/month will be charged automatically</p>
            </div>

            <p><strong>What you need to know:</strong></p>
            <ul style="line-height: 1.8;">
              <li>Your payment method on file will be charged $297 CAD monthly</li>
              <li>You can cancel anytime before the trial ends to avoid charges</li>
              <li>All your data and settings will be preserved</li>
              <li>No action needed if you wish to continue</li>
            </ul>

            <p style="margin-top: 30px;"><strong>How to manage your subscription:</strong></p>
            <p>Log in to your StackBuild account and visit the Settings page to manage your subscription or update your payment method.</p>

            <p style="margin-top: 30px;">We hope you're enjoying StackBuild Pro! If you have any questions, please contact our support team.</p>
            
            <p style="margin-top: 40px;">Best regards,<br><strong>The StackBuild Team</strong></p>
          </div>
        `;
        break;

      case 'payment_failed':
        subject = `Action Required: Payment Failed for StackBuild`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Payment Failed - Action Required</h2>
            <p>Dear ${company_name} Team,</p>
            <p>We were unable to process your payment for StackBuild Pro. Your subscription is currently past due.</p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0; color: #991b1b;">Grace Period Active</h3>
              <p style="margin: 0;"><strong>Access Ends:</strong> ${new Date(grace_period_end!).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 10px 0 0 0;"><strong>Grace Period:</strong> 5 Days</p>
            </div>

            <p><strong>What this means:</strong></p>
            <ul style="line-height: 1.8;">
              <li>You have <strong>5 days</strong> to update your payment method</li>
              <li>Your access will continue during this grace period</li>
              <li>After 5 days, your account will be suspended if payment is not received</li>
              <li>All your data will be safely stored and restored once payment is updated</li>
            </ul>

            <p style="margin-top: 30px;"><strong>How to update your payment:</strong></p>
            <ol style="line-height: 1.8;">
              <li>Log in to your StackBuild account</li>
              <li>Go to Settings → Subscription</li>
              <li>Click "Manage Billing" to update your payment method</li>
            </ol>

            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact our support team immediately.</p>
            
            <p style="margin-top: 40px;">Best regards,<br><strong>The StackBuild Team</strong></p>
          </div>
        `;
        break;
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'StackBuild <noreply@stackbuild.ca>',
        to: [adminEmail],
        subject: subject,
        html: htmlBody
      })
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await resendResponse.json();

    console.log('Trial email sent successfully:', {
      email_type,
      company_id,
      to: adminEmail,
      resend_id: result.id
    });

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error sending trial email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
