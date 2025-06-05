
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export async function sendWelcomeEmail(
  adminEmail: string, 
  adminFirstName: string, 
  adminLastName: string, 
  companyName: string
) {
  const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/supabase', '')}/`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; text-align: center;">🎉 Welcome to Construction Payroll Manager!</h1>
      
      <p>Dear ${adminFirstName} ${adminLastName},</p>
      
      <p>Congratulations! Your company <strong>${companyName}</strong> has been approved for Construction Payroll Manager.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Get Started:</h3>
        <ol>
          <li><a href="${loginUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">Login to your account</a></li>
          <li>Complete your company profile</li>
          <li>Add your employees to the system</li>
          <li>Set up jobsites for time tracking</li>
          <li>Start managing timesheets and payroll</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Access Your Dashboard
        </a>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h4 style="color: #92400e; margin-top: 0;">Need Help?</h4>
        <p style="color: #92400e; margin-bottom: 0;">
          Contact our support team at <a href="mailto:support@constructionpayroll.com" style="color: #92400e;">support@constructionpayroll.com</a> or call us at (555) 123-4567.
        </p>
      </div>
      
      <p style="color: #64748b; text-align: center; margin-top: 30px;">
        Thank you for choosing Construction Payroll Manager!<br>
        The Construction Payroll Team
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: 'Construction Payroll Manager <onboarding@resend.dev>',
      to: [adminEmail],
      subject: '🎉 Your Construction Payroll Manager account is approved!',
      html: emailHtml
    });

    console.log('Welcome email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}
