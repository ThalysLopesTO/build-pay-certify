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
