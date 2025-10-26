import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey'
};

interface SendEmailRequest {
  to: string;
  subject?: string;
  html?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  password?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    type: string; // MIME type
  }>;
}

const createStackBuildWelcomeHTML = (
  firstName: string,
  lastName: string,
  companyName: string,
  email: string,
  password: string
): string => {
  const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'User';
  
  return `
<div style="background-color:#f8f9fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#333;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background-color:#fff;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,0.08);overflow:hidden;">
    <div style="text-align:center;padding:30px 20px 10px 20px;">
      <img src="https://stackbuild.ca/wp-content/uploads/2025/07/logo-2-768x209.png" alt="StackBuild Logo" style="max-width:140px;" />
    </div>
    <div style="padding:30px 40px;text-align:left;line-height:1.6;">
      <h1 style="font-size:22px;color:#0f172a;">Welcome to StackBuild 🎉</h1>
      <p>Hi <strong>${companyName}</strong>,</p>
      <p>
        Welcome aboard! We're thrilled to have you testing
        <strong>StackBuild</strong> — your all-in-one construction
        management and payroll platform.
      </p>

      <p>Here are your login details:</p>

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

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 send-email function called [REDEPLOYED v2]:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: {
      'content-type': req.headers.get('content-type'),
      'authorization': req.headers.get('authorization') ? 'present' : 'missing',
      'user-agent': req.headers.get('user-agent'),
      'origin': req.headers.get('origin'),
      'referer': req.headers.get('referer')
    }
  });

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    console.log('❌ Invalid method:', req.method);
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    console.log('📧 Processing POST request for send-email function');
    
    // Check if RESEND_API_KEY is available and validate format
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RESEND_API_KEY is not configured in Supabase secrets" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate API key format (Resend keys start with "re_")
    if (!apiKey.startsWith('re_')) {
      console.error('❌ RESEND_API_KEY format appears invalid (should start with "re_")');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RESEND_API_KEY format is invalid" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('✅ RESEND_API_KEY is available and format looks correct');

    const requestBody: SendEmailRequest = await req.json();
    const { to, attachments } = requestBody;

    // Validate required field
    if (!to) {
      console.error('❌ Missing required field: to');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required field: to (recipient email)" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Determine email type and prepare content
    let html: string;
    let subject: string;
    
    if (requestBody.firstName && requestBody.password) {
      // StackBuild branded welcome email with credentials
      console.log('📧 Sending StackBuild branded welcome email');
      html = createStackBuildWelcomeHTML(
        requestBody.firstName,
        requestBody.lastName || '',
        requestBody.companyName || 'Your Company',
        to,
        requestBody.password
      );
      subject = "🎉 Welcome to StackBuild - Your Account is Ready!";
    } else if (requestBody.html && requestBody.subject) {
      // Generic HTML email (existing behavior)
      console.log('📧 Sending generic HTML email');
      html = requestBody.html;
      subject = requestBody.subject;
    } else {
      console.error('❌ Invalid request: must provide either (firstName + password) or (html + subject)');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request: must provide either StackBuild welcome parameters (firstName, password) or generic email parameters (html, subject)" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('❌ Invalid email format:', to);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid email address format" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('📧 Sending email:', {
      to,
      subject,
      hasHtml: !!html,
      attachmentCount: attachments?.length || 0,
      apiKeyStatus: 'Available'
    });

    if (attachments && attachments.length > 0) {
      console.log('📎 Attachments:', attachments.map(a => ({
        filename: a.filename,
        type: a.type,
        size: a.content.length
      })));
    }

    const emailData: any = {
      from: "StackBuild <no-reply@stackbuild.ca>",
      to: [to],
      subject: subject,
      html: html,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        type: attachment.type
      }));
    }

    const emailResponse = await resend.emails.send(emailData);

    if (emailResponse.error) {
      console.error('❌ Resend API error:', emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Resend API error: ${emailResponse.error.message}` 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("✅ Email sent successfully:", {
      id: emailResponse.data?.id,
      to,
      subject
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        id: emailResponse.data?.id 
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
    console.error("❌ Error in send-email function:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);