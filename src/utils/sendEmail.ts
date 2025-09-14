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

  // Enhanced retry logic for better reliability
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Sending email via Supabase Edge Function (attempt ${attempt}/${maxRetries}):`, {
        to: payload.to,
        subject: payload.subject,
        hasAttachments: payload.attachments?.length > 0,
        companyName: payload.companyName,
        apiKeyConfigured: true,
        functionsUrl: 'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
        timestamp: new Date().toISOString()
      });

      console.log('🔗 Invoking function with payload:', {
        payloadSize: JSON.stringify(payload).length,
        hasAttachments: !!payload.attachments?.length,
        attachmentCount: payload.attachments?.length || 0
      });

      // Create authenticated supabase client or use current client
      console.log('🔑 Client authentication status check...');
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload
      });

      if (error) {
        console.error(`❌ Supabase function invocation error (attempt ${attempt}):`, {
          error: error.message,
          context: error.context || 'No additional context',
          details: error.details || 'No additional details'
        });
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response data received from edge function');
      }

      if (!data.success) {
        console.error(`❌ Email function returned error (attempt ${attempt}):`, {
          error: data.error,
          details: data
        });
        throw new Error(data.error || 'Email sending failed - no success flag');
      }

      console.log('✅ Email sent successfully:', {
        attempt,
        id: data.id,
        message: data.message,
        recipient: payload.to
      });

      return {
        success: true,
        message: data.message || '✅ Email sent successfully'
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      console.error(`❌ Email send attempt ${attempt} failed:`, {
        error: lastError.message,
        stack: lastError.stack,
        requestData: {
          to: payload.to,
          subject: payload.subject,
          hasAttachments: payload.attachments?.length > 0,
          companyName: payload.companyName
        },
        willRetry: attempt < maxRetries
      });

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  console.error('❌ All email send attempts failed:', {
    finalError: lastError?.message,
    attempts: maxRetries,
    recipient: payload.to
  });

  return {
    success: false,
    error: lastError?.message || 'Failed to send email after multiple attempts'
  };
};
