import { createEmailWrapper, EmailWrapperData } from './emailTemplate';

interface SendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  companyData: {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string; // ✅ renamed for clarity
  };
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
  companyData
}: SendEmailParams): Promise<SendEmailResponse> => {
  try {
    // ✅ Prepare branded email wrapper data
    const emailWrapperData: EmailWrapperData = {
      subject,
      bodyText,
      companyName: companyData.name,
      companyAddress: companyData.address || '',
      companyPhone: companyData.phone || '',
      companyLogoUrl: companyData.logoUrl || '' // ✅ consistent naming
    };

    // ✅ Create branded HTML
    const html = createEmailWrapper(emailWrapperData);

    // ✅ Send email via Supabase Edge Function
    const response = await fetch(
      'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ to, subject, html })
      }
    );

    // ✅ Handle API errors cleanly
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
