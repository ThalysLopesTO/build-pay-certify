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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { to, subject, html, attachments }: SendEmailRequest = await req.json();

    console.log('Sending email to:', to, 'with subject:', subject);
    console.log('Using RESEND_API_KEY:', Deno.env.get("RESEND_API_KEY") ? 'Available' : 'Missing');
    if (attachments) {
      console.log('Attachments:', attachments.map(a => a.filename));
    }

    const emailData: any = {
      from: "Contact@stackbuild.ca",
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

    console.log("Email sent successfully:", emailResponse);

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
    console.error("Error in send-email function:", error);
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