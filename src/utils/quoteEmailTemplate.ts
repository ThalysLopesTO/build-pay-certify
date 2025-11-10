interface QuoteEmailData {
  clientName: string;
  companyName: string;
  projectName: string;
  quoteNumber: string;
  totalAmount: string;
  expiryDate: string;
  publicQuoteUrl: string;
  companyLogoUrl?: string;
  customMessage?: string;
}

export const createQuoteEmailHTML = (data: QuoteEmailData): string => {
  const {
    clientName,
    companyName,
    projectName,
    quoteNumber,
    totalAmount,
    expiryDate,
    publicQuoteUrl,
    companyLogoUrl,
    customMessage
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quote from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header with Logo -->
    <div style="text-align: center; padding: 40px 20px 20px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      ${companyLogoUrl ? `
        <img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 180px; max-height: 60px; margin-bottom: 20px;" />
      ` : ''}
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Your Quote is Ready!</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${clientName},
      </p>
      
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for considering <strong>${companyName}</strong> for your project. We've prepared a detailed quote for <strong>${projectName}</strong>.
      </p>

      ${customMessage ? `
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="font-size: 14px; color: #065f46; margin: 0; line-height: 1.5;">
            ${customMessage}
          </p>
        </div>
      ` : ''}

      <!-- Quote Details Card -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <div style="display: table; width: 100%; border-spacing: 0;">
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Quote Number:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${quoteNumber}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Project:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${projectName}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Total Amount:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #10b981; font-weight: 700; font-size: 18px;">$${totalAmount}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Valid Until:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${expiryDate}</div>
          </div>
        </div>
      </div>

      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
        Click the button below to view your quote online, approve it, or request changes:
      </p>

      <!-- Primary CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${publicQuoteUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; 
                  padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; 
                  font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
          📋 View Quote Online
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 20px 0 10px 0;">
        Or copy this link to your browser:
      </p>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; word-break: break-all; margin: 0 0 30px 0;">
        <a href="${publicQuoteUrl}" style="color: #10b981; text-decoration: none;">${publicQuoteUrl}</a>
      </p>

      <!-- PDF Download Section -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">
          📎 <strong>PDF Version Attached</strong>
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          A PDF copy of your quote is attached to this email for your records.
        </p>
      </div>

      <!-- What happens next -->
      <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 30px;">
        <h3 style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 0 0 15px 0;">
          📌 What happens next?
        </h3>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the detailed quote online at your convenience</li>
          <li>Approve the quote with your digital signature</li>
          <li>Request changes if you need adjustments</li>
          <li>We'll follow up to schedule the work once approved</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 30px 0 0 0;">
        If you have any questions, please don't hesitate to reach out. We're here to help!
      </p>

      <p style="font-size: 14px; color: #1f2937; margin: 20px 0 0 0;">
        Best regards,<br/>
        <strong>${companyName}</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        © ${new Date().getFullYear()} ${companyName}. All rights reserved.
      </p>
      <p style="font-size: 11px; color: #d1d5db; margin: 10px 0 0 0;">
        This quote was sent via StackBuild Construction Management Platform
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

export const getQuoteEmailSubject = (companyName: string, quoteNumber: string): string => {
  return `Your Quote #${quoteNumber} from ${companyName}`;
};
