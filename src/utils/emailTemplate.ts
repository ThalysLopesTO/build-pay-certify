export interface EmailWrapperData {
  subject: string;
  bodyText: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogoUrl?: string;
}

export function createEmailWrapper({ companyName, companyLogoUrl, companyAddress, companyPhone, bodyText }: Omit<EmailWrapperData, 'subject'>) {
  const paragraphs = bodyText
    .split(/\n+/)
    .map(p => `<p style="margin: 0 0 14px 0;">${p.trim()}</p>`)
    .join("\n")

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${companyName} Email</title>
  </head>
  <body style="background-color:#f8f9fb; font-family: Arial, sans-serif; padding: 30px 16px; color: #333;">
    <div style="max-width: 640px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      
      ${
        companyLogoUrl
          ? `<div style="text-align:center; margin-bottom:24px;">
              <img src="${companyLogoUrl}" alt="${companyName} Logo" style="max-width: 160px; max-height: 60px;" />
            </div>`
          : `<h2 style="text-align:center; margin-bottom:24px;">${companyName}</h2>`
      }

      <div style="font-size: 15px; line-height: 1.6;">
        ${paragraphs}
      </div>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #ddd;" />

      <footer style="font-size: 12px; color: #888; text-align: center;">
        ${companyAddress || companyPhone ? `${companyAddress}${companyAddress && companyPhone ? ' | ' : ''}${companyPhone}<br>` : ''}
        This email was sent by ${companyName} via StackBuild.
      </footer>
    </div>
  </body>
  </html>
  `;
}

// Alias for backward compatibility
export const wrapEmailHTML = createEmailWrapper;

export function getDefaultPlainTextTemplate(type: string, stage: string = 'general'): { subject: string; body_html: string } {
  const templates = {
    quote: {
      general: {
        subject: "Quote {{quote_number}} for {{project_name}}",
        body_html: "Dear {{client_name}},\n\nThank you for your interest in our services. Please find attached our quote for {{project_name}}.\n\nQuote Number: {{quote_number}}\nProject: {{project_name}}\nTotal Amount: ${{total_amount}}\nValid Until: {{expiry_date}}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\n{{company_name}}"
      },
      follow_up: {
        subject: "Follow-up: Quote {{quote_number}} for {{project_name}}",
        body_html: "Dear {{client_name}},\n\nI wanted to follow up on the quote we sent for {{project_name}}.\n\nQuote Number: {{quote_number}}\nTotal Amount: ${{total_amount}}\nValid Until: {{expiry_date}}\n\nDo you have any questions about our proposal? We'd be happy to discuss the details or make any adjustments.\n\nLooking forward to hearing from you.\n\nBest regards,\n{{company_name}}"
      }
    },
    invoice: {
      general: {
        subject: "Invoice {{invoice_number}} - {{project_name}}",
        body_html: "Dear {{client_name}},\n\nThank you for your business. Please find attached invoice {{invoice_number}} for {{project_name}}.\n\nInvoice Number: {{invoice_number}}\nProject: {{project_name}}\nAmount Due: ${{total_amount}}\nDue Date: {{due_date}}\n\nPayment can be made by check, bank transfer, or online payment.\n\nThank you for choosing {{company_name}}.\n\nBest regards,\n{{company_name}}"
      },
      before_due: {
        subject: "Reminder: Invoice {{invoice_number}} due {{due_date}}",
        body_html: "Dear {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{project_name}} is due on {{due_date}}.\n\nInvoice Number: {{invoice_number}}\nAmount Due: ${{total_amount}}\nDue Date: {{due_date}}\n\nIf you have already sent payment, please disregard this message.\n\nThank you,\n{{company_name}}"
      },
      overdue: {
        subject: "URGENT: Overdue Invoice {{invoice_number}}",
        body_html: "Dear {{client_name}},\n\nInvoice {{invoice_number}} for {{project_name}} is now overdue.\n\nInvoice Number: {{invoice_number}}\nAmount Due: ${{total_amount}}\nOriginal Due Date: {{due_date}}\n\nPlease remit payment immediately to avoid any disruption to our services.\n\nIf there are any issues with this invoice, please contact us immediately.\n\nThank you,\n{{company_name}}"
      }
    },
    invite: {
      general: {
        subject: "Welcome to {{company_name}} - Account Created",
        body_html: "Dear {{client_name}},\n\nWelcome to {{company_name}}! Your account has been created successfully.\n\nYou can now access your account to view invoices, quotes, and project updates.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\n{{company_name}}"
      }
    },
    welcome: {
      general: {
        subject: "Welcome to {{company_name}}!",
        body_html: "Dear {{client_name}},\n\nWelcome to {{company_name}}! We're excited to work with you.\n\nOur team is committed to providing you with exceptional service and quality workmanship.\n\nWe'll be in touch soon with project details and next steps.\n\nThank you for choosing {{company_name}}.\n\nBest regards,\n{{company_name}}"
      }
    },
    reminder: {
      general: {
        subject: "Reminder from {{company_name}}",
        body_html: "Dear {{client_name}},\n\nThis is a reminder regarding {{project_name}}.\n\n{{custom_message}}\n\nIf you have any questions, please contact us.\n\nBest regards,\n{{company_name}}"
      }
    }
  };

  const template = templates[type as keyof typeof templates]?.[stage as keyof typeof templates[keyof typeof templates]];
  return template || {
    subject: "Message from {{company_name}}",
    body_html: "Dear {{client_name}},\n\n{{custom_message}}\n\nBest regards,\n{{company_name}}"
  };
}
