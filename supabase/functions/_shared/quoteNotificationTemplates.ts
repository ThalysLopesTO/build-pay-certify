interface QuoteApprovedEmailData {
  clientName: string;
  companyName: string;
  projectName: string;
  quoteNumber: string;
  totalAmount: string;
  signedName: string;
  approvedAt: string;
  quoteUrl: string;
}

interface QuoteChangesRequestedEmailData {
  clientName: string;
  companyName: string;
  projectName: string;
  quoteNumber: string;
  totalAmount: string;
  changeMessage: string;
  requestedAt: string;
  quoteUrl: string;
}

interface QuoteDeclinedEmailData {
  clientName: string;
  companyName: string;
  projectName: string;
  quoteNumber: string;
  totalAmount: string;
  declineReason: string;
  declinedAt: string;
  quoteUrl: string;
}

export const createQuoteApprovedEmailHTML = (data: QuoteApprovedEmailData): string => {
  const {
    clientName,
    companyName,
    projectName,
    quoteNumber,
    totalAmount,
    signedName,
    approvedAt,
    quoteUrl
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Approved - ${quoteNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Quote Approved!</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Great news! <strong>${clientName}</strong> has approved the quote for <strong>${projectName}</strong>.
      </p>

      <!-- Quote Details Card -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #10b981;">
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
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Client:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${clientName}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Signed By:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${signedName}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Approved At:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${approvedAt}</div>
          </div>
        </div>
      </div>

      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
        You can now proceed with the project and convert this quote to an invoice.
      </p>

      <!-- Primary CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${quoteUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; 
                  padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; 
                  font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
          📋 View Quote in Dashboard
        </a>
      </div>

      <!-- Next Steps -->
      <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 30px;">
        <h3 style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 0 0 15px 0;">
          🎯 Next Steps
        </h3>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the approved quote details</li>
          <li>Convert the quote to an invoice</li>
          <li>Schedule the project start date</li>
          <li>Contact the client to confirm next steps</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0;">
        This is an automated notification from StackBuild. The client approved this quote through the public quote link.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        © ${new Date().getFullYear()} ${companyName}. All rights reserved.
      </p>
      <p style="font-size: 11px; color: #d1d5db; margin: 10px 0 0 0;">
        This notification was sent via StackBuild Construction Management Platform
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

export const createQuoteChangesRequestedEmailHTML = (data: QuoteChangesRequestedEmailData): string => {
  const {
    clientName,
    companyName,
    projectName,
    quoteNumber,
    totalAmount,
    changeMessage,
    requestedAt,
    quoteUrl
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Changes Requested - ${quoteNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Quote Changes Requested</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        <strong>${clientName}</strong> has requested changes to the quote for <strong>${projectName}</strong>.
      </p>

      <!-- Quote Details Card -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #f59e0b;">
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
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #f59e0b; font-weight: 700; font-size: 18px;">$${totalAmount}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Client:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${clientName}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Requested At:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${requestedAt}</div>
          </div>
        </div>
      </div>

      <!-- Client Message -->
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="font-size: 14px; color: #92400e; font-weight: 600; margin: 0 0 10px 0;">
          Client's Feedback:
        </h3>
        <p style="font-size: 14px; color: #78350f; margin: 0; line-height: 1.6; white-space: pre-wrap;">${changeMessage}</p>
      </div>

      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
        Review the client's feedback and update the quote accordingly.
      </p>

      <!-- Primary CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${quoteUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; 
                  padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; 
                  font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.25);">
          📋 Review & Respond
        </a>
      </div>

      <!-- Next Steps -->
      <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 30px;">
        <h3 style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 0 0 15px 0;">
          🎯 Next Steps
        </h3>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the client's change request carefully</li>
          <li>Update the quote with the requested changes</li>
          <li>Resend the updated quote to the client</li>
          <li>Follow up with the client to discuss any questions</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0;">
        This is an automated notification from StackBuild. The client submitted this change request through the public quote link.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        © ${new Date().getFullYear()} ${companyName}. All rights reserved.
      </p>
      <p style="font-size: 11px; color: #d1d5db; margin: 10px 0 0 0;">
        This notification was sent via StackBuild Construction Management Platform
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

export const getQuoteApprovedEmailSubject = (quoteNumber: string, clientName: string): string => {
  return `🎉 Quote #${quoteNumber} Approved by ${clientName}`;
};

export const getQuoteChangesRequestedEmailSubject = (quoteNumber: string, clientName: string): string => {
  return `💬 Quote #${quoteNumber} - Changes Requested by ${clientName}`;
};

export const createQuoteDeclinedEmailHTML = (data: QuoteDeclinedEmailData): string => {
  const {
    clientName,
    companyName,
    projectName,
    quoteNumber,
    totalAmount,
    declineReason,
    declinedAt,
    quoteUrl
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Declined - ${quoteNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Quote Declined</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        <strong>${clientName}</strong> has declined the quote for <strong>${projectName}</strong>.
      </p>

      <!-- Quote Details Card -->
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #ef4444;">
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
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 700; font-size: 18px;">$${totalAmount}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Client:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${clientName}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Declined At:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${declinedAt}</div>
          </div>
        </div>
      </div>

      <!-- Decline Reason -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937; font-weight: 600;">Reason for Declining:</h3>
        <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${declineReason}</p>
      </div>

      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
        <strong>Next Steps:</strong>
      </p>

      <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 30px 20px; padding: 0;">
        <li>Review the client's feedback</li>
        <li>Consider reaching out to discuss their concerns</li>
        <li>Determine if a revised quote is appropriate</li>
      </ul>

      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${quoteUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 12px 8px;">
          Review Quote
        </a>
        <a href="mailto:${clientName}" style="display: inline-block; background-color: #6b7280; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 8px 12px 8px;">
          Contact Client
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1f2937;">${companyName}</p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        This is an automated notification from your quote management system.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

export const getQuoteDeclinedEmailSubject = (quoteNumber: string, clientName: string): string => {
  return `❌ Quote #${quoteNumber} Declined by ${clientName}`;
};

export const createQuoteChangesResponseEmailHTML = (
  clientName: string,
  quoteNumber: string,
  projectName: string,
  clientChangeRequest: string,
  adminResponse: string,
  adminName: string,
  publicToken: string,
  totalAmount: number
): string => {
  const quoteUrl = `${FRONTEND_URL}/quote/${publicToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Response to Your Quote Change Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .quote-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .change-request-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .response-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Response to Your Change Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Quote #${quoteNumber}</p>
        </div>
        
        <div class="content">
          <p>Hi ${clientName},</p>
          
          <p>Thank you for your feedback on the quote. We've reviewed your change request and have responded below.</p>
          
          <div class="quote-info">
            <h3 style="margin-top: 0; color: #667eea;">Quote Details</h3>
            <p><strong>Project:</strong> ${projectName}</p>
            <p><strong>Quote Number:</strong> ${quoteNumber}</p>
            <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
          </div>
          
          <div class="change-request-box">
            <h4 style="margin-top: 0; color: #2196f3;">Your Change Request:</h4>
            <p style="margin: 0; font-style: italic;">"${clientChangeRequest}"</p>
          </div>
          
          <div class="response-box">
            <h4 style="margin-top: 0; color: #4caf50;">Our Response:</h4>
            <p style="margin: 0; white-space: pre-wrap;">${adminResponse}</p>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
              - ${adminName}
            </p>
          </div>
          
          <p>Please review the updated quote and let us know if you have any questions or if you're ready to proceed.</p>
          
          <div style="text-align: center;">
            <a href="${quoteUrl}" class="button">View Updated Quote</a>
          </div>
          
          <p style="margin-top: 30px;">If you have any questions or need further clarification, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>${adminName}<br>StackBuild Team</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} StackBuild. All rights reserved.</p>
          <p>This is an automated message regarding your quote request.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getQuoteChangesResponseEmailSubject = (quoteNumber: string): string => {
  return `Response to Your Quote Change Request - Quote #${quoteNumber}`;
};
