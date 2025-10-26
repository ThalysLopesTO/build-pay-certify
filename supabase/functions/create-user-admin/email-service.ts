import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WelcomeEmailParams {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  password: string;
}

const createWelcomeEmailHTML = (
  firstName: string,
  lastName: string,
  companyName: string,
  email: string,
  password: string
) => {
  const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User';
  
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

      <p>Your account has been created for <strong>${companyName}</strong>. Here are your login details:</p>

      <div style="background-color:#f3f4f6;border-radius:8px;padding:15px;margin:20px 0;font-family:monospace;">
        📧 <strong>Email:</strong> ${email}<br />
        🔑 <strong>Temporary Password:</strong> ${password}
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

export const sendUserWelcomeEmail = async ({
  email,
  firstName,
  lastName,
  companyName,
  password,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Sending welcome email to:', email);
    
    const html = createWelcomeEmailHTML(firstName, lastName, companyName, email, password);

    const emailResponse = await resend.emails.send({
      from: "StackBuild <onboarding@resend.dev>",
      to: [email],
      subject: "🎉 Welcome to StackBuild - Your Account is Ready!",
      html,
    });

    console.log('Welcome email sent successfully:', emailResponse);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send welcome email' 
    };
  }
};
