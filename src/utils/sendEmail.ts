import { createEmailWrapper, EmailWrapperData } from './emailTemplate';

interface SendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  companyData: {
    name: string;
    address?: string;
    phone?: string;
    logo?: string;
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
    // Create branded HTML email
    const emailWrapperData: EmailWrapperData = {
      subject,
      bodyText,
      companyName: companyData.name,
      companyAddress: companyData.address || '',
      companyPhone: companyData.phone || '',
      companyLogo: companyData.logo
    };

    const html = createEmailWrapper(emailWrapperData);

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

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
