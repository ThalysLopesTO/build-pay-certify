import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

interface SendPasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { email }: SendPasswordResetRequest = await req.json();
    console.log('Password reset requested for email:', email);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, get user from auth.users by email
    const { data: authUserData, error: authError } = await supabaseClient.auth.admin.getUserByEmail(email);
    
    if (authError || !authUserData?.user) {
      console.log('User not found in auth.users:', email);
      // Return success regardless to prevent account enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user profile (all users can reset their password)
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_id, first_name, last_name, role, company_id')
      .eq('user_id', authUserData.user.id)
      .single();

    if (profileError || !userProfile) {
      console.log('User not found or not authorized for password reset:', email);
      // Return success regardless to prevent account enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset link has been sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate secure reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    const { error: tokenError } = await supabaseClient
      .from('password_reset_tokens')
      .insert({
        user_id: userProfile.user_id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      throw new Error('Failed to generate reset token');
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Create reset URL
    const resetUrl = `https://app.stackbuild.ca/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailResponse = await resend.emails.send({
      from: "StackBuild <noreply@stackbuild.ca>",
      to: [email],
      subject: "🔐 Reset Your StackBuild Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your StackBuild Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #F26522 0%, #E55A1F 100%); padding: 40px 30px; text-align: center;">
              <img src="https://stackbuild.ca/logo.png" alt="StackBuild Logo" style="height: 50px; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #2D3748; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
                Hi ${userProfile.first_name || 'there'},
              </p>
              
              <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset the password for your StackBuild account associated with <strong>${email}</strong>.
              </p>
              
              <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to create a new password. This link will expire in 1 hour for security reasons.
              </p>
              
              <!-- Reset Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #F26522 0%, #E55A1F 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(242, 101, 34, 0.3); transition: all 0.2s ease;">
                  🔐 Reset My Password
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #E2E8F0;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 15px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #F26522; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #F7FAFC; padding: 30px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                Need help? Contact us at <a href="mailto:support@stackbuild.ca" style="color: #F26522; text-decoration: none;">support@stackbuild.ca</a>
              </p>
              <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} StackBuild. All rights reserved.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    // Log the password reset attempt
    await supabaseClient
      .from('password_reset_logs')
      .insert({
        target_user_id: userProfile.user_id,
        target_user_email: email,
        target_user_name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        company_id: userProfile.company_id || null
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset email sent successfully" 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);