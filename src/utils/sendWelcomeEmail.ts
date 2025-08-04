import { supabase } from '@/integrations/supabase/client';

interface WelcomeEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

const createWelcomeEmailHTML = (userName: string, email: string, companyName: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to StackBuild</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 40px 30px; text-align: center;">
          <img src="https://stackbuild.ca/logo.png" alt="StackBuild Logo" style="max-height: 60px; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to StackBuild!</h1>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">👋 Welcome, ${userName}!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Your account has been successfully created for <strong>${companyName}</strong>.
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #374151; font-size: 16px;">
              <strong>🔐 Login Email:</strong> ${email}
            </p>
          </div>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            You can log in now to start managing your construction company with tools built for speed and accuracy.
          </p>

          <!-- Login Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.stackbuild.ca/login" 
               style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
              Login to StackBuild →
            </a>
          </div>

          <!-- Features List -->
          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">Access your dashboard to:</h3>
            <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>🏗️ Manage jobsites and track progress</li>
              <li>⏰ Clock in/out and monitor time tracking</li>
              <li>💰 Handle payroll and employee management</li>
              <li>📋 Store and track certificates</li>
            </ul>
          </div>

          <!-- Support -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; color: #92400e; font-size: 16px; text-align: center;">
              <strong>Need help?</strong> Contact us at 
              <a href="mailto:support@stackbuild.ca" style="color: #92400e; text-decoration: none; font-weight: bold;">support@stackbuild.ca</a>
            </p>
          </div>

          <p style="color: #6b7280; font-size: 16px; margin: 30px 0 0 0; text-align: center;">
            - The StackBuild Team
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            © 2024 StackBuild. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendWelcomeEmail = async ({
  to,
  firstName,
  lastName,
  companyName
}: WelcomeEmailParams) => {
  const userName = firstName && lastName ? `${firstName} ${lastName}` : 'there';
  const subject = '🎉 Welcome to StackBuild – You\'re Ready to Build Smarter';
  
  // Create the HTML email content
  const html = createWelcomeEmailHTML(userName, to, companyName);
  
  // Send directly using Supabase edge function
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject,
      html,
      companyName: 'StackBuild',
      companyLogoUrl: 'https://stackbuild.ca/logo.png'
    }
  });

  if (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }

  return data;
};