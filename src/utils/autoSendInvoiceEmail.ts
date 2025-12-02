import { Invoice } from '@/components/admin/types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { sendEmail } from '@/utils/sendEmail';
import { generateBrandedInvoicePDFBlob, blobToBase64 } from '@/components/admin/BrandedInvoicePDF';
import { createInvoiceEmailHTML, getInvoiceEmailSubject } from '@/utils/invoiceEmailTemplate';
import { format } from 'date-fns';

interface AutoSendEmailResult {
  success: boolean;
  error?: string;
}

export const autoSendInvoiceEmail = async (
  invoice: Invoice,
  settings: CompanySettings | null,
  logoUrl: string | null,
  portalUrl?: string
): Promise<AutoSendEmailResult> => {
  try {
    console.log('📧 Auto-sending invoice email:', {
      invoiceNumber: invoice.invoice_number,
      recipient: invoice.client_email,
      timestamp: new Date().toISOString()
    });

    // Validate company settings
    if (!settings?.company_name || !settings?.company_address || !settings?.company_email || !settings?.company_phone) {
      return {
        success: false,
        error: 'Company settings incomplete. Please complete your company information in settings.'
      };
    }

    // Validate client email
    if (!invoice.client_email) {
      return {
        success: false,
        error: 'Client email is required to send invoice.'
      };
    }

    // Validate line items
    if (!invoice.invoice_line_items || invoice.invoice_line_items.length === 0) {
      return {
        success: false,
        error: 'Invoice must have at least one line item.'
      };
    }

    // Generate email content with branded HTML template
    const subject = getInvoiceEmailSubject(settings.company_name, invoice.invoice_number);
    
    const html = createInvoiceEmailHTML({
      clientName: invoice.client_company,
      companyName: settings.company_name,
      invoiceNumber: invoice.invoice_number,
      invoiceTitle: invoice.title,
      totalAmount: invoice.total_amount.toFixed(2),
      dueDate: format(new Date(invoice.due_date), 'MMM dd, yyyy'),
      companyLogoUrl: logoUrl || undefined,
      customMessage: invoice.notes || undefined,
      portalUrl: portalUrl,
    });

    // Fallback plain text (for email clients that don't support HTML)
    const bodyText = `
Dear ${invoice.client_company},

Please find attached Invoice #${invoice.invoice_number} for your review.

Invoice Details:
- Invoice Number: ${invoice.invoice_number}
- Project: ${invoice.title}
- Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}
- Total Amount: $${invoice.total_amount.toFixed(2)}

${invoice.notes ? `Notes: ${invoice.notes}\n\n` : ''}
Please remit payment by the due date listed on the invoice.

If you have any questions regarding this invoice, please contact us at ${settings.company_email} or ${settings.company_phone}.

Thank you for your business!

Best regards,
${settings.company_name}
    `.trim();

    // Generate PDF attachment using professional template
    const { blob, filename } = await generateBrandedInvoicePDFBlob(invoice, settings, logoUrl);
    const base64Content = await blobToBase64(blob);

    // Send email with branded HTML and PDF attachment
    const emailResult = await sendEmail({
      to: invoice.client_email,
      subject,
      bodyText,
      customHtml: html,
      companyData: {
        name: settings.company_name,
        address: settings.company_address,
        phone: settings.company_phone,
        logoUrl
      },
      attachments: [
        {
          filename,
          content: base64Content,
          type: 'application/pdf'
        }
      ]
    });

    if (emailResult.success) {
      console.log('✅ Invoice email sent successfully');
      return { success: true };
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('❌ Error auto-sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invoice email'
    };
  }
};
