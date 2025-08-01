/**
 * Utility functions for creating branded email templates
 */

export interface EmailWrapperData {
  subject: string;
  bodyText: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyLogo?: string;
}

/**
 * Converts plain text to HTML paragraphs
 */
export const textToHtml = (text: string): string => {
  if (!text) return '';
  
  // Split by double line breaks to create paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  
  return paragraphs
    .map(paragraph => {
      // Handle single line breaks within paragraphs
      const lines = paragraph.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length === 0) return '';
      
      // Join lines with <br> tags for line breaks within paragraphs
      const content = lines.join('<br>');
      return `<p style="margin: 0 0 16px 0; line-height: 1.6;">${content}</p>`;
    })
    .join('');
};

/**
 * Creates a professional branded email HTML template
 */
export const createEmailWrapper = (data: EmailWrapperData): string => {
  const { bodyText, companyName, companyAddress, companyPhone, companyLogo } = data;
  
  const htmlBody = textToHtml(bodyText);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
      background-color: #f8f9fa;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 40px 32px 20px;
      text-align: center;
      border-bottom: 2px solid #f8f9fa;
    }
    .logo {
      max-width: 200px;
      max-height: 80px;
      margin-bottom: 20px;
    }
    .content {
      padding: 32px;
      background-color: #ffffff;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer-text {
      font-size: 14px;
      color: #6c757d;
      margin: 0;
      line-height: 1.5;
    }
    .company-name {
      font-weight: bold;
      color: #333333;
      margin-bottom: 8px;
    }
    p {
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    p:last-child {
      margin-bottom: 0;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="logo">` : ''}
      <div class="company-name" style="font-size: 24px; font-weight: bold; color: #333; margin-top: ${companyLogo ? '10px' : '0'};">
        ${companyName}
      </div>
    </div>
    
    <div class="content">
      ${htmlBody}
    </div>
    
    <div class="footer">
      <p class="footer-text company-name">${companyName}</p>
      ${companyAddress ? `<p class="footer-text">${companyAddress}</p>` : ''}
      ${companyPhone ? `<p class="footer-text">${companyPhone}</p>` : ''}
    </div>
  </div>
</body>
</html>`.trim();
};

/**
 * Default plain text templates for different email types and stages
 */
export const getDefaultPlainTextTemplate = (
  templateType: string, 
  reminderStage: string
): { subject: string; body_html: string } => {
  
  const templates: Record<string, Record<string, { subject: string; body_html: string }>> = {
    quote: {
      general: {
        subject: 'Quote #{{quote_number}} for {{project_name}}',
        body_html: 'Dear {{client_name}},\n\nThank you for your interest in our services. Please find attached your quote for {{project_name}}.\n\nQuote Details:\n- Quote Number: {{quote_number}}\n- Project: {{project_name}}\n- Total Amount: ${{total_amount}}\n- Valid Until: {{expiry_date}}\n\nWe appreciate the opportunity to work with you and look forward to hearing from you soon.\n\nIf you have any questions about this quote, please don\'t hesitate to contact us.\n\nBest regards,\n{{company_name}} Team'
      },
      follow_up: {
        subject: 'Follow-up: Quote #{{quote_number}} for {{project_name}}',
        body_html: 'Dear {{client_name}},\n\nI wanted to follow up on the quote we sent you for {{project_name}} (Quote #{{quote_number}}).\n\nWe\'re here to answer any questions you might have and would be happy to discuss the project details further.\n\nQuote Summary:\n- Total Amount: ${{total_amount}}\n- Valid Until: {{expiry_date}}\n\nPlease let us know if you\'d like to move forward or if you need any clarifications.\n\nBest regards,\n{{company_name}} Team'
      }
    },
    invoice: {
      general: {
        subject: 'Invoice #{{invoice_number}} from {{company_name}}',
        body_html: 'Dear {{client_name}},\n\nThank you for your business. Please find your invoice attached.\n\nInvoice Details:\n- Invoice Number: {{invoice_number}}\n- Project: {{project_name}}\n- Total Amount: ${{total_amount}}\n- Due Date: {{due_date}}\n\nPayment can be made via the methods outlined in the invoice. Please remit payment by the due date to avoid any late fees.\n\nThank you for choosing {{company_name}}.\n\nBest regards,\n{{company_name}} Team'
      },
      before_due: {
        subject: 'Friendly Reminder: Invoice #{{invoice_number}} Due {{due_date}}',
        body_html: 'Dear {{client_name}},\n\nThis is a friendly reminder that Invoice #{{invoice_number}} for ${{total_amount}} is due on {{due_date}}.\n\nWe wanted to give you a heads up so you have time to process the payment.\n\nIf you have any questions about this invoice or need assistance, please don\'t hesitate to reach out to us.\n\nThank you for your business!\n\nBest regards,\n{{company_name}} Team'
      },
      overdue: {
        subject: 'URGENT: Overdue Invoice #{{invoice_number}} - Immediate Attention Required',
        body_html: 'Dear {{client_name}},\n\nOur records indicate that Invoice #{{invoice_number}} for ${{total_amount}} was due on {{due_date}} and remains unpaid.\n\nPlease remit payment immediately to avoid additional late fees or service interruption.\n\nIf you have already sent payment, please disregard this notice. If you have questions about this invoice or are experiencing payment difficulties, please contact us immediately to discuss options.\n\nWe value our business relationship and want to resolve this matter promptly.\n\nUrgent attention required.\n\n{{company_name}} Accounts Receivable'
      }
    },
    invite: {
      general: {
        subject: 'Welcome to {{company_name}} - Employee Invitation',
        body_html: 'Welcome to {{company_name}}!\n\nWe\'re excited to have you join our team. Your employee account has been created and you can now access the system.\n\nGetting Started:\n1. Use the login credentials provided separately\n2. Complete your profile setup\n3. Review company policies and procedures\n\nIf you have any questions during your onboarding process, please don\'t hesitate to reach out to your supervisor or HR department.\n\nWelcome aboard!\n\n{{company_name}} Team'
      }
    },
    welcome: {
      general: {
        subject: 'Welcome to {{company_name}}!',
        body_html: 'Welcome to {{company_name}}!\n\nThank you for joining us. We\'re excited to have you as part of our community.\n\nYour account has been successfully created and you\'re ready to get started.\n\nIf you need any assistance, our support team is here to help.\n\nBest regards,\n{{company_name}} Team'
      }
    },
    reminder: {
      general: {
        subject: 'Reminder from {{company_name}}',
        body_html: 'Dear {{client_name}},\n\nThis is a reminder regarding your account with {{company_name}}.\n\nIf you have any questions, please contact us.\n\nBest regards,\n{{company_name}} Team'
      }
    }
  };

  return templates[templateType]?.[reminderStage] || templates[templateType]?.['general'] || {
    subject: 'Message from {{company_name}}',
    body_html: 'Thank you for your business.\n\nBest regards,\n{{company_name}} Team'
  };
};