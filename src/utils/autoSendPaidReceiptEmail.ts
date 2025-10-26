import { Invoice } from '@/components/admin/types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { generateBrandedInvoicePDFBlob, blobToBase64 } from '@/components/admin/BrandedInvoicePDF';
import { sendEmail } from './sendEmail';
import { format } from 'date-fns';

export interface AutoSendPaidReceiptResult {
  success: boolean;
  error?: string;
}

export const autoSendPaidReceiptEmail = async (
  invoice: Invoice,
  settings: CompanySettings | null,
  logoUrl: string | null
): Promise<AutoSendPaidReceiptResult> => {
  try {
    // Validate required data
    if (!invoice.client_email) {
      return { success: false, error: 'No client email address provided' };
    }

    if (!settings?.company_name || !settings?.company_email) {
      return { success: false, error: 'Company settings incomplete' };
    }

    if (!invoice.invoice_line_items || invoice.invoice_line_items.length === 0) {
      return { success: false, error: 'No line items in invoice' };
    }

    // Generate email subject
    const subject = `🎉 Receipt for Invoice #${invoice.invoice_number} - PAID`;

    // Format dates
    const paidDate = format(new Date(), 'MMM dd, yyyy');
    const invoiceDate = format(new Date(invoice.created_at), 'MMM dd, yyyy');

    // Generate email body
    const emailBody = `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Payment Received!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
            Dear ${invoice.client_company},
          </p>
          
          <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
            Thank you for your payment! This email confirms that we have received your payment for Invoice #${invoice.invoice_number}.
          </p>
          
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 16px;">Payment Details</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">#${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Invoice Date:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${invoiceDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Payment Date:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${paidDate}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0 0 0; color: #111827; font-weight: 600; font-size: 16px;">Amount Paid:</td>
                <td style="padding: 12px 0 0 0; text-align: right; font-weight: 700; color: #16a34a; font-size: 18px;">$${invoice.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin: 24px 0;">
            Please find attached your paid receipt for your records.
          </p>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Need help?</strong> If you have any questions about this payment or need additional documentation, 
              please don't hesitate to contact us.
            </p>
          </div>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">
              📧 ${settings.company_email}
            </p>
            ${settings.company_phone ? `
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">
              📞 ${settings.company_phone}
            </p>
            ` : ''}
            ${settings.company_address ? `
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0;">
              📍 ${settings.company_address}
            </p>
            ` : ''}
          </div>
          
          <p style="font-size: 15px; color: #374151; margin-top: 32px;">
            Thank you for your business!
          </p>
          
          <p style="font-size: 15px; color: #374151; margin: 8px 0;">
            Best regards,<br/>
            <strong>${settings.company_name}</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 24px; font-size: 12px; color: #9ca3af;">
          © ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.
        </div>
      </div>
    `;

    // Generate PDF with professional PAID badge
    const { blob, filename } = await generateBrandedInvoicePDFBlob(
      invoice,
      settings,
      logoUrl
    );

    // Convert PDF to base64
    const base64PDF = await blobToBase64(blob);

    // Send email with PDF attachment
    const emailResult = await sendEmail({
      to: invoice.client_email,
      subject,
      bodyText: emailBody,
      companyData: {
        name: settings.company_name,
        address: settings.company_address || undefined,
        phone: settings.company_phone || undefined,
        logoUrl: logoUrl || undefined,
      },
      attachments: [
        {
          filename,
          content: base64PDF,
          type: 'application/pdf',
        },
      ],
    });

    if (!emailResult.success) {
      return { 
        success: false, 
        error: emailResult.error || 'Failed to send receipt email' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending paid receipt email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
