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
  customHtml?: string; // ✅ NEW: Allow custom HTML that bypasses wrapper
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
  attachments = [],  // ✅ Default empty array
  customHtml // ✅ NEW: Allow custom HTML that bypasses wrapper
}: SendEmailParams): Promise<SendEmailResponse> => {
  // ✅ Use custom HTML if provided, otherwise generate wrapper
  const html = customHtml || (() => {
    const emailWrapperData: EmailWrapperData = {
      subject,
      bodyText,
      companyName: companyData.name,
      companyAddress: companyData.address || '',
      companyPhone: companyData.phone || '',
      companyLogoUrl: companyData.logoUrl || ''
    };
    return createEmailWrapper(emailWrapperData);
  })();

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
      console.log(`📧 AGGRESSIVE DEBUG - Sending email via Supabase Edge Function (attempt ${attempt}/${maxRetries}):`, {
        to: payload.to,
        subject: payload.subject,
        hasAttachments: payload.attachments?.length > 0,
        companyName: payload.companyName,
        apiKeyConfigured: true,
        functionsUrl: 'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
        timestamp: new Date().toISOString(),
        payloadSize: JSON.stringify(payload).length,
        payloadKeys: Object.keys(payload),
        supabaseClient: !!supabase,
        clientType: supabase.constructor.name,
        hasAuth: !!supabase.auth
      });

      console.log('🔗 AGGRESSIVE DEBUG - Pre-invocation checks:', {
        functionName: 'send-email',
        payload: payload,
        supabaseInstance: supabase.constructor.name,
        hasAuth: !!supabase.auth,
        authUser: await supabase.auth.getUser().then(r => r.data.user?.id || 'none').catch(() => 'error-getting-user')
      });

      // METHOD 1: Try simplified Supabase client invocation
      console.log('🚀 METHOD 1 - Simplified Supabase function invoke...');
      
      let invokeResult;
      let invokeError = null;
      
      try {
        // Simplest possible invocation - no extra headers
        invokeResult = await supabase.functions.invoke('send-email', {
          body: payload
        });
        console.log('✅ METHOD 1 SUCCESS - Function invoke returned:', invokeResult);
      } catch (error) {
        invokeError = error;
        console.error('❌ METHOD 1 FAILED - Function invoke error:', {
          error,
          errorMessage: error?.message,
          errorStack: error?.stack,
          errorName: error?.name
        });
      }

      // METHOD 2: Fallback to direct HTTP if Supabase client fails
      if (invokeError) {
        console.log('🔄 METHOD 2 - Trying direct HTTP fallback...');
        const functionUrl = 'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email';
        
        try {
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWp3cGFqdmNtYWhvYW13d3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDM4NDcsImV4cCI6MjA2NDQ3OTg0N30.bmtRnTF2Jf36ukaLkBnhxs2X6u5fZxqyOyqkeZYmlNA`,
            },
            body: JSON.stringify(payload)
          });

          console.log('📡 Direct HTTP response status:', response.status, response.statusText);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const responseData = await response.json();
          console.log('✅ METHOD 2 SUCCESS - Direct HTTP returned:', responseData);
          
          invokeResult = { data: responseData, error: null };
        } catch (httpError) {
          console.error('❌ METHOD 2 FAILED - Direct HTTP error:', httpError);
          throw new Error(`Both Supabase client and direct HTTP failed. Supabase error: ${invokeError.message}, HTTP error: ${httpError.message}`);
        }
      }

      const { data, error } = invokeResult;

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
