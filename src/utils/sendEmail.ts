import { createEmailWrapper, EmailWrapperData } from './emailTemplate';
import { supabase } from '@/integrations/supabase/client';

interface Attachment {
  filename: string;
  content: string;   // ✅ Base64 string (no data: prefix)
  type?: string;     // ✅ Optional, defaults to "application/pdf"
}

interface SendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  companyData: {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;   // ✅ company logo URL for branding
  };
  attachments?: Attachment[]; // ✅ Optional attachments array
}

interface SendEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const sendEmail = async ({
  to,
  subject,
  bodyText,
  companyData,
  attachments = []  // ✅ Default empty array
}: SendEmailParams): Promise<SendEmailResponse> => {
  // ✅ Prepare branded email wrapper data for preview
  const emailWrapperData: EmailWrapperData = {
    subject,
    bodyText,
    companyName: companyData.name,
    companyAddress: companyData.address || '',
    companyPhone: companyData.phone || '',
    companyLogoUrl: companyData.logoUrl || ''
  };

  // ✅ Generate branded HTML for preview purposes
  const html = createEmailWrapper(emailWrapperData);

  // ✅ Build payload for Supabase Edge Function
  const payload: any = {
    to,
    subject,
    html,
    companyName: companyData.name,          // ✅ NEW: pass company name
    companyLogoUrl: companyData.logoUrl || '' // ✅ NEW: pass logo URL
  };

  // ✅ Only include attachments if present
  if (attachments.length > 0) {
    payload.attachments = attachments.map(file => ({
      filename: file.filename,
      content: file.content,
      type: file.type || 'application/pdf'
    }));
  }

  try {
    // ✅ Send email via Supabase Edge Function using proper client invocation
    console.log('📧 Sending email via Supabase Edge Function:', {
      to: payload.to,
      subject: payload.subject,
      hasAttachments: payload.attachments?.length > 0,
      companyName: payload.companyName
    });

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload
    });

    if (error) {
      console.error('❌ Supabase function invocation error:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    if (!data.success) {
      console.error('❌ Email function returned error:', data.error);
      throw new Error(data.error || 'Email sending failed');
    }

    console.log('✅ Email sent successfully:', {
      id: data.id,
      message: data.message
    });
    return {
      success: true,
      message: data.message || '✅ Email sent successfully'
    };
  } catch (error) {
    console.error('❌ Error sending email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestData: {
        to: payload.to,
        subject: payload.subject,
        hasAttachments: payload.attachments?.length > 0
      }
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
