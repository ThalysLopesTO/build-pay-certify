import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// ============= INTERFACES =============
interface Company {
  id: string;
  name: string;
  status: string;
  subscription_status: string;
  company_settings: {
    enable_invoice_reminders: boolean;
    invoice_reminder_days_before: number;
    invoice_overdue_reminder_days: number;
    enable_quote_reminders: boolean;
    quote_reminder_days: number;
    enable_quote_expiry_reminders: boolean;
    quote_expiry_reminder_days_before: number;
    company_email: string;
    company_name: string;
    company_address?: string;
    company_phone?: string;
    company_logo_url?: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  client_company: string;
  client_email: string;
  client_id?: string;
  total_amount: number;
  due_date: string;
  status: string;
  company_id: string;
}

interface Quote {
  id: string;
  quote_number: string;
  project_name: string;
  client_name: string;
  client_email: string;
  client_id?: string;
  total_amount: number;
  quote_date: string;
  expiry_date?: string;
  status: string;
  public_status?: string;
  public_token?: string;
  company_id: string;
}

// ============= PROFESSIONAL EMAIL TEMPLATES =============

function createInvoiceBeforeDueReminderHTML(data: {
  clientName: string;
  companyName: string;
  invoiceNumber: string;
  invoiceTitle: string;
  totalAmount: string;
  dueDate: string;
  daysUntilDue: number;
  portalUrl?: string;
  companyLogoUrl?: string;
}): string {
  const { clientName, companyName, invoiceNumber, invoiceTitle, totalAmount, dueDate, daysUntilDue, portalUrl, companyLogoUrl } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header with Gradient -->
    <div style="text-align: center; padding: 40px 20px 20px 20px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
      ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 180px; max-height: 60px; margin-bottom: 20px;" />` : ''}
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">📅 Payment Reminder</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${clientName},
      </p>
      
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        This is a friendly reminder that your invoice for <strong>${invoiceTitle}</strong> is due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>. Please arrange payment at your convenience to avoid any late fees.
      </p>

      <!-- Invoice Details Card -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <div style="display: table; width: 100%; border-spacing: 0;">
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${invoiceNumber}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Project:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${invoiceTitle}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Due:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #3b82f6; font-weight: 700; font-size: 18px;">$${totalAmount}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${dueDate}</div>
          </div>
        </div>
      </div>

      ${portalUrl ? `
        <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
          Click the button below to view your invoice and make a payment:
        </p>

        <!-- Primary CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; 
                    padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; 
                    font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
            💳 View Invoice & Pay
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 20px 0 10px 0;">
          Or copy this link to your browser:
        </p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; word-break: break-all; margin: 0 0 30px 0;">
          <a href="${portalUrl}" style="color: #10b981; text-decoration: none;">${portalUrl}</a>
        </p>
      ` : ''}

      <!-- What happens next -->
      <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 30px;">
        <h3 style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 0 0 15px 0;">
          📌 What happens next?
        </h3>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Access your client portal to view invoice details</li>
          <li>Download a PDF copy for your records</li>
          <li>Make a payment before the due date</li>
          <li>Contact us if you have any questions</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 30px 0 0 0;">
        If you've already made payment, please disregard this reminder. Thank you for your business!
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
        This is an automated payment reminder
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

function createInvoiceOverdueReminderHTML(data: {
  clientName: string;
  companyName: string;
  invoiceNumber: string;
  invoiceTitle: string;
  totalAmount: string;
  dueDate: string;
  daysOverdue: number;
  portalUrl?: string;
  companyLogoUrl?: string;
}): string {
  const { clientName, companyName, invoiceNumber, invoiceTitle, totalAmount, dueDate, daysOverdue, portalUrl, companyLogoUrl } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Overdue Invoice from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header with Urgent Gradient -->
    <div style="text-align: center; padding: 40px 20px 20px 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 180px; max-height: 60px; margin-bottom: 20px;" />` : ''}
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">⚠️ Payment Overdue</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${clientName},
      </p>
      
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Your invoice for <strong>${invoiceTitle}</strong> is now <strong style="color: #ef4444;">${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue</strong>. Please arrange payment as soon as possible to avoid any additional late fees.
      </p>

      <!-- Alert Box -->
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="font-size: 14px; color: #991b1b; margin: 0; line-height: 1.5;">
          <strong>Important:</strong> To maintain your account in good standing, please settle this invoice at your earliest convenience.
        </p>
      </div>

      <!-- Invoice Details Card -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <div style="display: table; width: 100%; border-spacing: 0;">
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${invoiceNumber}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Project:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${invoiceTitle}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Overdue:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #ef4444; font-weight: 700; font-size: 18px;">$${totalAmount}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Original Due Date:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${dueDate}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Days Overdue:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #ef4444; font-weight: 600; font-size: 14px;">${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      ${portalUrl ? `
        <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
          Click the button below to pay now and bring your account current:
        </p>

        <!-- Primary CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; 
                    padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; 
                    font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
            💳 Pay Now
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 20px 0 10px 0;">
          Or copy this link to your browser:
        </p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; word-break: break-all; margin: 0 0 30px 0;">
          <a href="${portalUrl}" style="color: #10b981; text-decoration: none;">${portalUrl}</a>
        </p>
      ` : ''}

      <!-- What happens next -->
      <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 30px;">
        <h3 style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 0 0 15px 0;">
          📌 What happens next?
        </h3>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Access your client portal to view invoice details</li>
          <li>Make a payment to settle your balance</li>
          <li>Late fees may apply after 30 days</li>
          <li>Contact us if you need payment arrangements</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 30px 0 0 0;">
        If you've already made payment, please disregard this reminder. If you're experiencing any difficulties, please reach out to us—we're happy to discuss payment options.
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
        This is an automated overdue payment notice
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

function createQuoteFollowUpReminderHTML(data: {
  clientName: string;
  companyName: string;
  quoteNumber: string;
  projectName: string;
  totalAmount: string;
  quoteDate: string;
  daysSinceSent: number;
  portalUrl?: string;
  companyLogoUrl?: string;
}): string {
  const { clientName, companyName, quoteNumber, projectName, totalAmount, quoteDate, daysSinceSent, portalUrl, companyLogoUrl } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Following Up on Your Quote from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header with Gradient -->
    <div style="text-align: center; padding: 40px 20px 20px 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 180px; max-height: 60px; margin-bottom: 20px;" />` : ''}
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">👋 Following Up on Your Quote</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${clientName},
      </p>
      
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        We wanted to follow up on the quote we sent ${daysSinceSent} day${daysSinceSent !== 1 ? 's' : ''} ago for <strong>${projectName}</strong>. We'd love to help bring your project to life!
      </p>

      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        If you have any questions or would like to discuss adjustments to the scope, we're here to help.
      </p>

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
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Quote Date:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${quoteDate}</div>
          </div>
        </div>
      </div>

      ${portalUrl ? `
        <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
          Click the button below to review your quote and take the next step:
        </p>

        <!-- Primary CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; 
                    padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; 
                    font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
            📋 Review Quote
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 20px 0 10px 0;">
          Or copy this link to your browser:
        </p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; word-break: break-all; margin: 0 0 30px 0;">
          <a href="${portalUrl}" style="color: #10b981; text-decoration: none;">${portalUrl}</a>
        </p>
      ` : ''}

      <!-- What happens next -->
      <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 30px;">
        <h3 style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 0 0 15px 0;">
          📌 What happens next?
        </h3>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the detailed quote online</li>
          <li>Approve the quote with your digital signature</li>
          <li>Request changes if you need adjustments</li>
          <li>We'll schedule the work once you approve</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 30px 0 0 0;">
        We're excited about the opportunity to work with you. Please don't hesitate to reach out if you have any questions!
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
        This is an automated quote follow-up
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

function createQuoteExpiryReminderHTML(data: {
  clientName: string;
  companyName: string;
  quoteNumber: string;
  projectName: string;
  totalAmount: string;
  expiryDate: string;
  daysUntilExpiry: number;
  portalUrl?: string;
  companyLogoUrl?: string;
}): string {
  const { clientName, companyName, quoteNumber, projectName, totalAmount, expiryDate, daysUntilExpiry, portalUrl, companyLogoUrl } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quote Expires Soon - ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header with Urgent Gradient -->
    <div style="text-align: center; padding: 40px 20px 20px 20px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 180px; max-height: 60px; margin-bottom: 20px;" />` : ''}
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">⏰ Your Quote Expires Soon!</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${clientName},
      </p>
      
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
        This is a friendly reminder that your quote for <strong>${projectName}</strong> expires in <strong style="color: #f59e0b;">${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</strong>. Don't miss out on locking in this price!
      </p>

      <!-- Alert Box -->
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.5;">
          <strong>Act now:</strong> After the expiry date, we may need to requote based on current pricing and availability.
        </p>
      </div>

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
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Expires On:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #f59e0b; font-weight: 600; font-size: 14px;">${expiryDate}</div>
          </div>
          <div style="display: table-row;">
            <div style="display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px;">Time Remaining:</div>
            <div style="display: table-cell; padding: 8px 0; text-align: right; color: #f59e0b; font-weight: 600; font-size: 14px;">${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      ${portalUrl ? `
        <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
          Click the button below to review and accept your quote before it expires:
        </p>

        <!-- Primary CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; 
                    padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; 
                    font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
            ✅ Accept Quote Now
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 20px 0 10px 0;">
          Or copy this link to your browser:
        </p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; word-break: break-all; margin: 0 0 30px 0;">
          <a href="${portalUrl}" style="color: #10b981; text-decoration: none;">${portalUrl}</a>
        </p>
      ` : ''}

      <!-- What happens next -->
      <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 30px;">
        <h3 style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 0 0 15px 0;">
          📌 What happens next?
        </h3>
        <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the quote details in your client portal</li>
          <li>Accept with your digital signature to lock in pricing</li>
          <li>We'll reach out to schedule your project</li>
          <li>Need changes? Request them before expiry</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 30px 0 0 0;">
        If you need more time or have questions, please reach out to us. We're happy to discuss your options!
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
        This is an automated quote expiry reminder
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============= HELPER FUNCTIONS =============

async function getClientPortalToken(clientId: string): Promise<string | null> {
  if (!clientId) return null;
  
  const { data, error } = await supabase
    .from('clients')
    .select('portal_token')
    .eq('id', clientId)
    .single();
  
  if (error || !data) {
    console.log(`⚠️ Could not fetch portal token for client ${clientId}`);
    return null;
  }
  
  return data.portal_token;
}

function getPortalUrl(portalToken: string | null, section: string = ''): string | null {
  if (!portalToken) return null;
  const baseUrl = 'https://app.stackbuild.ca/client';
  return section ? `${baseUrl}/${portalToken}/${section}` : `${baseUrl}/${portalToken}`;
}

// ============= MAIN HANDLER =============

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('📧 Starting daily reminder process...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        status,
        subscription_status,
        company_settings (
          enable_invoice_reminders,
          invoice_reminder_days_before,
          invoice_overdue_reminder_days,
          enable_quote_reminders,
          quote_reminder_days,
          enable_quote_expiry_reminders,
          quote_expiry_reminder_days_before,
          company_email,
          company_name,
          company_address,
          company_phone,
          company_logo_url
        )
      `)
      .eq('status', 'active')
      .in('subscription_status', ['active', 'trialing']);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch companies' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🏢 Processing ${companies?.length || 0} active companies`);

    for (const company of companies || []) {
      await processCompanyReminders(company as Company);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${companies?.length || 0} companies` 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔥 Error in send-reminders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function processCompanyReminders(company: Company) {
  const settings = company.company_settings;
  if (!settings) {
    console.log(`⚠️ No settings found for ${company.name}`);
    return;
  }

  console.log(`📌 Processing reminders for: ${company.name}`);

  if (settings.enable_invoice_reminders) {
    await processInvoiceReminders(company, settings);
  }

  if (settings.enable_quote_reminders) {
    await processQuoteReminders(company, settings);
  }

  if (settings.enable_quote_expiry_reminders) {
    await processQuoteExpiryReminders(company, settings);
  }

  // Always process birthday emails
  await processBirthdayEmails(company, settings);
}

// ============= INVOICE REMINDERS =============

async function processInvoiceReminders(company: Company, settings: any) {
  const today = new Date();
  const beforeDueDate = new Date(today);
  beforeDueDate.setDate(today.getDate() + settings.invoice_reminder_days_before);
  
  const overdueDateCheck = new Date(today);
  overdueDateCheck.setDate(today.getDate() - settings.invoice_overdue_reminder_days);

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, client_id')
    .eq('company_id', company.id)
    .in('status', ['pending', 'sent'])
    .or(`due_date.eq.${beforeDueDate.toISOString().split('T')[0]},due_date.eq.${overdueDateCheck.toISOString().split('T')[0]}`);

  if (error) {
    console.error(`❌ Error fetching invoices for ${company.name}:`, error);
    return;
  }

  for (const invoice of invoices || []) {
    const invoiceDueDate = new Date(invoice.due_date);
    const isBeforeDue = invoiceDueDate.toDateString() === beforeDueDate.toDateString();
    const isOverdue = invoiceDueDate.toDateString() === overdueDateCheck.toDateString();

    if (isBeforeDue || isOverdue) {
      const reminderType = isOverdue ? 'overdue' : 'before_due';
      const alreadySent = await checkReminderSent(company.id, 'invoice', invoice.id, reminderType);
      if (alreadySent) {
        console.log(`⏩ Reminder already sent for invoice ${invoice.invoice_number}`);
        continue;
      }
      await sendInvoiceReminder(company, invoice as Invoice, reminderType, settings);
    }
  }
}

// ============= QUOTE REMINDERS =============

async function processQuoteReminders(company: Company, settings: any) {
  const today = new Date();
  const reminderDate = new Date(today);
  reminderDate.setDate(today.getDate() - settings.quote_reminder_days);

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*, client_id')
    .eq('company_id', company.id)
    .eq('status', 'sent')
    .eq('quote_date', reminderDate.toISOString().split('T')[0]);

  if (error) {
    console.error(`❌ Error fetching quotes for ${company.name}:`, error);
    return;
  }

  for (const quote of quotes || []) {
    const alreadySent = await checkReminderSent(company.id, 'quote', quote.id, 'follow_up');
    if (alreadySent) {
      console.log(`⏩ Reminder already sent for quote ${quote.quote_number}`);
      continue;
    }
    await sendQuoteReminder(company, quote as Quote, settings);
  }
}

// ============= QUOTE EXPIRY REMINDERS =============

async function processQuoteExpiryReminders(company: Company, settings: any) {
  const today = new Date();
  const expiryReminderDate = new Date(today);
  expiryReminderDate.setDate(today.getDate() + settings.quote_expiry_reminder_days_before);
  
  console.log(`📅 Checking for quotes expiring on ${expiryReminderDate.toISOString().split('T')[0]} for ${company.name}`);

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*, client_id')
    .eq('company_id', company.id)
    .eq('status', 'sent')
    .in('public_status', ['awaiting_response', 'changes_requested'])
    .eq('expiry_date', expiryReminderDate.toISOString().split('T')[0])
    .not('expiry_date', 'is', null);

  if (error) {
    console.error(`❌ Error fetching expiring quotes for ${company.name}:`, error);
    return;
  }

  console.log(`📧 Found ${quotes?.length || 0} expiring quotes to process`);

  for (const quote of quotes || []) {
    const alreadySent = await checkReminderSent(company.id, 'quote_expiry', quote.id, 'expiry_reminder');
    if (alreadySent) {
      console.log(`⏩ Expiry reminder already sent for quote ${quote.quote_number}`);
      continue;
    }
    await sendQuoteExpiryReminder(company, quote as Quote, settings);
  }
}

// ============= CHECK REMINDER =============

async function checkReminderSent(companyId: string, type: string, recordId: string, reminderType: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('reminder_logs')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', type)
    .eq('record_id', recordId)
    .gte('sent_at', `${today}T00:00:00.000Z`)
    .lt('sent_at', `${today}T23:59:59.999Z`)
    .limit(1);

  if (error) {
    console.error('❌ Error checking reminder logs:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

// ============= SEND INVOICE REMINDER =============

async function sendInvoiceReminder(company: Company, invoice: Invoice, reminderType: string, settings: any) {
  try {
    console.log(`📧 Sending ${reminderType} reminder for invoice ${invoice.invoice_number}...`);
    
    // Get client portal token
    const portalToken = invoice.client_id ? await getClientPortalToken(invoice.client_id) : null;
    const portalUrl = getPortalUrl(portalToken, 'invoices');
    
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const companyName = settings.company_name || company.name;
    
    let html: string;
    let subject: string;
    
    if (reminderType === 'overdue') {
      const daysOverdue = Math.abs(diffDays);
      html = createInvoiceOverdueReminderHTML({
        clientName: invoice.client_company,
        companyName,
        invoiceNumber: invoice.invoice_number,
        invoiceTitle: invoice.title,
        totalAmount: invoice.total_amount.toFixed(2),
        dueDate: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        daysOverdue,
        portalUrl: portalUrl || undefined,
        companyLogoUrl: settings.company_logo_url || undefined
      });
      subject = `⚠️ URGENT: Invoice ${invoice.invoice_number} is ${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''} Overdue`;
    } else {
      const daysUntilDue = diffDays;
      html = createInvoiceBeforeDueReminderHTML({
        clientName: invoice.client_company,
        companyName,
        invoiceNumber: invoice.invoice_number,
        invoiceTitle: invoice.title,
        totalAmount: invoice.total_amount.toFixed(2),
        dueDate: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        daysUntilDue,
        portalUrl: portalUrl || undefined,
        companyLogoUrl: settings.company_logo_url || undefined
      });
      subject = `📅 Payment Reminder: Invoice ${invoice.invoice_number} Due in ${daysUntilDue} Day${daysUntilDue !== 1 ? 's' : ''}`;
    }

    await supabase.functions.invoke('send-email', {
      body: { to: invoice.client_email, subject, html }
    });

    await logReminder(company.id, 'invoice', invoice.id);
    console.log(`✅ Invoice ${reminderType} reminder sent for ${invoice.invoice_number} to ${invoice.client_email}`);

  } catch (error) {
    console.error(`❌ Error sending invoice reminder for ${invoice.invoice_number}:`, error);
  }
}

// ============= SEND QUOTE REMINDER =============

async function sendQuoteReminder(company: Company, quote: Quote, settings: any) {
  try {
    console.log(`📧 Sending follow-up reminder for quote ${quote.quote_number}...`);
    
    // Get client portal token
    const portalToken = quote.client_id ? await getClientPortalToken(quote.client_id) : null;
    const portalUrl = getPortalUrl(portalToken);
    
    const companyName = settings.company_name || company.name;
    const quoteDate = new Date(quote.quote_date);
    const daysSinceSent = settings.quote_reminder_days;

    const html = createQuoteFollowUpReminderHTML({
      clientName: quote.client_name,
      companyName,
      quoteNumber: quote.quote_number,
      projectName: quote.project_name,
      totalAmount: quote.total_amount.toFixed(2),
      quoteDate: quoteDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      daysSinceSent,
      portalUrl: portalUrl || undefined,
      companyLogoUrl: settings.company_logo_url || undefined
    });
    
    const subject = `👋 Following Up: Quote ${quote.quote_number} for ${quote.project_name}`;

    await supabase.functions.invoke('send-email', {
      body: { to: quote.client_email, subject, html }
    });

    await logReminder(company.id, 'quote', quote.id);
    console.log(`✅ Quote follow-up reminder sent for ${quote.quote_number} to ${quote.client_email}`);

  } catch (error) {
    console.error(`❌ Error sending quote reminder for ${quote.quote_number}:`, error);
  }
}

// ============= SEND QUOTE EXPIRY REMINDER =============

async function sendQuoteExpiryReminder(company: Company, quote: Quote, settings: any) {
  try {
    console.log(`📧 Sending expiry reminder for quote ${quote.quote_number}...`);
    
    // Get client portal token
    const portalToken = quote.client_id ? await getClientPortalToken(quote.client_id) : null;
    const portalUrl = getPortalUrl(portalToken);
    
    const companyName = settings.company_name || company.name;
    const expiryDate = quote.expiry_date ? new Date(quote.expiry_date) : null;
    const daysUntilExpiry = settings.quote_expiry_reminder_days_before;

    const html = createQuoteExpiryReminderHTML({
      clientName: quote.client_name,
      companyName,
      quoteNumber: quote.quote_number,
      projectName: quote.project_name,
      totalAmount: quote.total_amount.toFixed(2),
      expiryDate: expiryDate ? expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
      daysUntilExpiry,
      portalUrl: portalUrl || undefined,
      companyLogoUrl: settings.company_logo_url || undefined
    });
    
    const subject = `⏰ Your Quote ${quote.quote_number} Expires in ${daysUntilExpiry} Day${daysUntilExpiry !== 1 ? 's' : ''} - Don't Miss Out!`;

    await supabase.functions.invoke('send-email', {
      body: { to: quote.client_email, subject, html }
    });

    await logReminder(company.id, 'quote_expiry', quote.id);
    console.log(`✅ Quote expiry reminder sent for ${quote.quote_number} to ${quote.client_email}`);

  } catch (error) {
    console.error(`❌ Error sending quote expiry reminder for ${quote.quote_number}:`, error);
  }
}

// ============= LOG REMINDER =============

async function logReminder(companyId: string, type: string, recordId: string) {
  const { error } = await supabase
    .from('reminder_logs')
    .insert({
      company_id: companyId,
      type: type,
      record_id: recordId,
      sent_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Error logging reminder:', error);
  }
}

// ============= BIRTHDAY EMAIL TEMPLATE =============

function createBirthdayEmailHTML(data: {
  employeeName: string;
  companyName: string;
  companyLogoUrl?: string;
}): string {
  const { employeeName, companyName, companyLogoUrl } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday from ${companyName}!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header with Festive Gradient -->
    <div style="text-align: center; padding: 50px 20px 30px 20px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%);">
      ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 140px; max-height: 50px; margin-bottom: 20px; border-radius: 8px;" />` : ''}
      <div style="font-size: 60px; margin-bottom: 10px;">🎂</div>
      <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        Happy Birthday!
      </h1>
    </div>

    <!-- Confetti Banner -->
    <div style="text-align: center; padding: 15px; background: linear-gradient(90deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%);">
      <span style="font-size: 24px;">🎉 🎈 🎁 🎊 🥳 🎉</span>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
        Dear <strong>${employeeName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #4b5563; line-height: 1.8; margin: 0 0 20px 0; text-align: center;">
        On behalf of everyone at <strong style="color: #7c3aed;">${companyName}</strong>, we wanted to take a moment to wish you a very <strong>Happy Birthday!</strong>
      </p>

      <!-- Birthday Message Card -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border: 2px solid #86efac;">
        <p style="font-size: 16px; color: #166534; line-height: 1.7; margin: 0; text-align: center;">
          🌟 Thank you for being such a <strong>valuable part of our team</strong>. Your hard work, dedication, and positive attitude make a real difference every day.
        </p>
      </div>

      <p style="font-size: 16px; color: #4b5563; line-height: 1.8; margin: 20px 0; text-align: center;">
        We hope your special day is filled with <strong>joy, laughter, and celebration!</strong> May the year ahead bring you success, happiness, and all the things you wish for. 🎁
      </p>

      <!-- Celebration Icons -->
      <div style="text-align: center; margin: 30px 0; font-size: 36px;">
        🎂 🍰 🎈 🎁 🥳
      </div>

      <p style="font-size: 16px; color: #1f2937; margin: 30px 0 10px 0; text-align: center;">
        Best wishes,<br/>
        <strong style="color: #7c3aed;">The ${companyName} Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); padding: 25px; text-align: center; border-top: 1px solid #e9d5ff;">
      <p style="font-size: 14px; color: #7c3aed; margin: 0 0 5px 0; font-weight: 600;">
        🎉 Have a wonderful birthday! 🎉
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        © ${new Date().getFullYear()} ${companyName}
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============= BIRTHDAY EMAIL PROCESSING =============

async function processBirthdayEmails(company: Company, settings: any) {
  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = today.getDate();
    
    console.log(`🎂 Checking for birthdays today (${todayMonth}/${todayDay}) for ${company.name}...`);

    // Query employees with birthdays today
    const { data: birthdayEmployees, error } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, date_of_birth')
      .eq('company_id', company.id)
      .eq('is_active', true)
      .not('date_of_birth', 'is', null)
      .not('email', 'is', null);

    if (error) {
      console.error(`❌ Error fetching employees for birthday check:`, error);
      return;
    }

    // Filter employees whose birthday matches today
    const employeesWithBirthdayToday = (birthdayEmployees || []).filter(emp => {
      if (!emp.date_of_birth) return false;
      const dob = new Date(emp.date_of_birth);
      return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
    });

    console.log(`🎈 Found ${employeesWithBirthdayToday.length} employees with birthdays today`);

    for (const employee of employeesWithBirthdayToday) {
      // Check if we already sent a birthday email today
      const alreadySent = await checkReminderSent(company.id, 'birthday', employee.user_id, 'birthday_email');
      if (alreadySent) {
        console.log(`⏩ Birthday email already sent to ${employee.email} today`);
        continue;
      }

      await sendBirthdayEmail(company, employee, settings);
    }

  } catch (error) {
    console.error(`❌ Error processing birthday emails for ${company.name}:`, error);
  }
}

// ============= SEND BIRTHDAY EMAIL =============

async function sendBirthdayEmail(company: Company, employee: any, settings: any) {
  try {
    const companyName = settings.company_name || company.name;
    const employeeName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Team Member';

    console.log(`🎂 Sending birthday email to ${employee.email} (${employeeName})...`);

    const html = createBirthdayEmailHTML({
      employeeName,
      companyName,
      companyLogoUrl: settings.company_logo_url || undefined
    });

    const subject = `🎂 Happy Birthday, ${employee.first_name || employeeName}! From ${companyName}`;

    await supabase.functions.invoke('send-email', {
      body: { to: employee.email, subject, html }
    });

    await logReminder(company.id, 'birthday', employee.user_id);
    console.log(`✅ Birthday email sent to ${employee.email}`);

  } catch (error) {
    console.error(`❌ Error sending birthday email to ${employee.email}:`, error);
  }
}

serve(handler);
