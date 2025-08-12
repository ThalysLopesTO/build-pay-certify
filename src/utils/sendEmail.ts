import { createEmailWrapper, EmailWrapperData } from './emailTemplate';

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
  try {
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

    // ✅ Send email via Supabase Edge Function
    const response = await fetch(
      'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWp3cGFqdmNtYWhvYW13d3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDM4NDcsImV4cCI6MjA2NDQ3OTg0N30.bmtRnTF2Jf36ukaLkBnhxs2X6u5fZxqyOyqkeZYmlNA'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || '✅ Email sent successfully'
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
