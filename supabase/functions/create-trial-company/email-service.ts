import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface TrialWelcomeEmailParams {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  password: string;
  trialDays: number;
  trialEndDate: Date;
  employeeLimit: number;
}

const createTrialWelcomeEmailHTML = ({
  firstName,
  lastName,
  companyName,
  email,
  password,
  trialDays,
  trialEndDate,
  employeeLimit,
}: TrialWelcomeEmailParams) => {
  const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User';
  const formattedEndDate = trialEndDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
<div style="background-color:#f8f9fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#333;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background-color:#fff;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,0.08);overflow:hidden;">
    <div style="text-align:center;padding:30px 20px 10px 20px;">
      <img src="https://stackbuild.ca/wp-content/uploads/2025/07/logo-2-768x209.png" alt="StackBuild Logo" style="max-width:140px;" />
    </div>
    <div style="padding:30px 40px;text-align:left;line-height:1.6;">
      <h1 style="font-size:22px;color:#0f172a;">Welcome to StackBuild 🎉</h1>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>
        Welcome aboard! We're thrilled to have you testing
        <strong>StackBuild</strong> — your all-in-one construction
        management and payroll platform.
      </p>

      <p>Your <strong>FREE trial account</strong> has been created for <strong>${companyName}</strong>. Here are your login details:</p>

      <div style="background-color:#f3f4f6;border-radius:8px;padding:15px;margin:20px 0;font-family:monospace;">
        📧 <strong>Email:</strong> ${email}<br />
        🔑 <strong>Temporary Password:</strong> ${password}
      </div>

      <div style="background-color:#ecfdf5;border:1px solid #10b981;border-radius:8px;padding:15px;margin:20px 0;">
        <h3 style="margin-top:0;color:#059669;">✨ Your Trial Details:</h3>
        <ul style="list-style:none;padding:0;margin:0;">
          <li style="margin:8px 0;">📅 <strong>Trial Period:</strong> ${trialDays} days</li>
          <li style="margin:8px 0;">⏰ <strong>Ends:</strong> ${formattedEndDate}</li>
          <li style="margin:8px 0;">👥 <strong>Employee Limit:</strong> ${employeeLimit} employees</li>
          <li style="margin:8px 0;">💳 <strong>Payment Required:</strong> NO - This is a free trial!</li>
        </ul>
      </div>

      <p>
        👉 Log in at
        <a href="https://app.stackbuild.ca" target="_blank" style="color:#10b981;font-weight:bold;">app.stackbuild.ca</a>
        and go to <strong>Settings → Profile → Change Password</strong> to
        update your password for security.
      </p>

      <div style="text-align:center;margin:25px 0;">
        <a href="https://app.stackbuild.ca" target="_blank" style="display:inline-block;background-color:#10b981;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
          Go to Dashboard
        </a>
      </div>

      <p style="margin-top:30px;">
        If you need any help, just reply to this email or contact us at
        <a href="mailto:support@stackbuild.ca" style="color:#10b981;text-decoration:none;">support@stackbuild.ca</a>.
      </p>

      <p>Let's build smarter together. 🧱</p>
      <p><strong>— The StackBuild Team</strong></p>
    </div>
    <div style="text-align:center;font-size:12px;color:#777;padding:25px;background-color:#f8f9fb;">
      © 2025 StackBuild Inc. · Toronto, Ontario<br />
      <a href="https://www.stackbuild.ca" style="color:#10b981;text-decoration:none;">www.stackbuild.ca</a>
    </div>
  </div>
</div>
  `;
};

export const sendTrialWelcomeEmail = async (params: TrialWelcomeEmailParams): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Sending trial welcome email to:', params.email);
    
    const html = createTrialWelcomeEmailHTML(params);

    const emailResponse = await resend.emails.send({
      from: "StackBuild <onboarding@resend.dev>",
      to: [params.email],
      subject: `🎉 Welcome to StackBuild - Your ${params.trialDays} Day FREE Trial!`,
      html,
    });

    console.log('Trial welcome email sent successfully:', emailResponse);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error sending trial welcome email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send trial welcome email' 
    };
  }
};
