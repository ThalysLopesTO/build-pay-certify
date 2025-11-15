import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  action: 'approved' | 'declined' | 'changes_requested' | 'message_sent';
  quoteId?: string;
  quoteNumber?: string;
  clientName?: string;
  projectName?: string;
  message?: string;
  subject?: string;
  companyId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { 
      action, 
      quoteId, 
      quoteNumber, 
      clientName, 
      projectName, 
      message,
      subject,
      companyId 
    }: NotificationRequest = await req.json();

    console.log("Sending notification:", { action, quoteNumber, clientName });

    // Get company settings to find admin email
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('company_email, company_name')
      .eq('company_id', companyId)
      .single();

    if (settingsError || !companySettings?.company_email) {
      console.error("No company email found:", settingsError);
      return new Response(
        JSON.stringify({ error: "Company email not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailSubject = '';
    let emailHtml = '';

    switch (action) {
      case 'approved':
        emailSubject = `✅ Quote #${quoteNumber} Approved by ${clientName}`;
        emailHtml = `
          <h2>Great news! A quote has been approved.</h2>
          <p><strong>Quote:</strong> #${quoteNumber}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Status:</strong> Approved ✅</p>
          <br/>
          <p>Log in to your admin dashboard to view the full details and next steps.</p>
        `;
        break;

      case 'declined':
        emailSubject = `❌ Quote #${quoteNumber} Declined by ${clientName}`;
        emailHtml = `
          <h2>A quote has been declined.</h2>
          <p><strong>Quote:</strong> #${quoteNumber}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Status:</strong> Declined ❌</p>
          ${message ? `<p><strong>Reason:</strong> ${message}</p>` : ''}
          <br/>
          <p>Log in to your admin dashboard to review the details.</p>
        `;
        break;

      case 'changes_requested':
        emailSubject = `📝 Changes Requested for Quote #${quoteNumber}`;
        emailHtml = `
          <h2>A client has requested changes to a quote.</h2>
          <p><strong>Quote:</strong> #${quoteNumber}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Status:</strong> Changes Requested 📝</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <br/>
          <p>Log in to your admin dashboard to review and respond to the request.</p>
        `;
        break;

      case 'message_sent':
        emailSubject = `💬 New Message from ${clientName}`;
        emailHtml = `
          <h2>You have received a new message from a client.</h2>
          <p><strong>From:</strong> ${clientName}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="padding: 16px; background-color: #f5f5f5; border-radius: 8px; margin: 16px 0;">
            ${message}
          </p>
          <br/>
          <p>Please respond to the client at your earliest convenience.</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Quote System <onboarding@resend.dev>",
      to: [companySettings.company_email],
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              h2 { color: #2563eb; }
              .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              ${emailHtml}
              <div class="footer">
                <p>This is an automated notification from ${companySettings.company_name}.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
