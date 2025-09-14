import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    type: string; // MIME type
  }>;
}

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

    const { to, subject, html, attachments }: SendEmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      console.error('❌ Missing required fields:', { to: !!to, subject: !!subject, html: !!html });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: to, subject, or html" 
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