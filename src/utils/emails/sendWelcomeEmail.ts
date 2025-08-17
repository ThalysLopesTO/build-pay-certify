import { supabase } from '@/integrations/supabase/client';

interface WelcomeEmailParams {
  to: string;
  name?: string;
}

const createWelcomeEmailHTML = (name: string, email: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to StackBuild</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c, #fb923c); padding: 40px 30px; text-align: center; color: white;">
          <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">StackBuild</div>
          <div style="font-size: 18px; opacity: 0.9;">Welcome to the Platform</div>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h1 style="color: #1e293b; margin: 0 0 24px 0; font-size: 28px; font-weight: 600;">
            Welcome, ${name}! 🎉
          </h1>
          
          <p style="color: #475569; font-size: 16px; margin: 0 0 24px 0;">
            Your StackBuild account has been successfully created and is now active. You're all set to start managing your construction projects with our powerful tools.
          </p>

          <div style="background-color: #f1f5f9; border-left: 4px solid #ea580c; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; color: #334155; font-size: 16px;">
              <strong>📧 Your Login Email:</strong> ${email}
            </p>
          </div>

          <p style="color: #475569; font-size: 16px; margin: 24px 0;">
            Ready to get started? Click the button below to access your dashboard and begin exploring all the features StackBuild has to offer.
          </p>

          <!-- Login Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://stackbuild.ca/admin-login" 
               style="display: inline-block; background: linear-gradient(135deg, #ea580c, #fb923c); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3); transition: all 0.3s ease;">
              Access Your Dashboard →
            </a>
          </div>

          <!-- Features Preview -->
          <div style="margin: 32px 0;">
            <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">What you can do with StackBuild:</h3>
            <ul style="color: #475569; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>🏗️ Manage jobsites and track project progress</li>
              <li>⏰ Handle time tracking and employee clock-ins</li>
              <li>💰 Streamline payroll and HR management</li>
              <li>📋 Store and manage certificates and documents</li>
            </ul>
          </div>

          <!-- Support Info -->
          <div style="background-color: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 32px 0;">
            <p style="margin: 0; color: #92400e; font-size: 16px; text-align: center;">
              <strong>Need help getting started?</strong> Our support team is here to help at 
              <a href="mailto:support@stackbuild.ca" style="color: #92400e; text-decoration: none; font-weight: 600;">support@stackbuild.ca</a>
            </p>
          </div>

          <p style="color: #64748b; font-size: 16px; margin: 32px 0 0 0; text-align: center; font-style: italic;">
            Welcome to the StackBuild family!<br>
            - The StackBuild Team
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0;">
            © 2024 StackBuild. All rights reserved.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This email was sent to ${email}. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendWelcomeEmail = async ({ to, name }: WelcomeEmailParams) => {
  try {
    // Use email prefix as fallback if name is not provided
    const displayName = name || to.split('@')[0];
    const subject = '🎉 Welcome to StackBuild – Your Account is Ready!';
    
    // Create the HTML email content
    const html = createWelcomeEmailHTML(displayName, to);
    
    // Send via Supabase edge function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html
      }
    });

    if (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw error to avoid breaking registration flow
      return { success: false, error: error.message };
    }

    console.log('✅ Welcome email sent successfully to:', to);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Welcome email error:', error);
    // Don't throw error to avoid breaking registration flow
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};