import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from './types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';

// Helper function to generate the invoice HTML
const generateInvoiceHTML = (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoUrl?: string | null
): string => {
  return `
    <div style="font-family: sans-serif; padding: 32px; max-width: 750px; margin: auto; border: 1px solid #ddd;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
        <div>
          ${logoUrl ? `<img src="${logoUrl}" style="max-height: 60px; margin-bottom: 8px;" />` : ''}
          <div style="font-size: 20px; font-weight: bold;">${companySettings.company_name}</div>
          <div style="color: #666; font-size: 12px;">
            ${companySettings.company_address || ''}<br/>
            ${companySettings.company_phone ? 'Phone: ' + companySettings.company_phone + '<br/>' : ''}
            ${companySettings.company_email ? 'Email: ' + companySettings.company_email + '<br/>' : ''}
            ${companySettings.hst_number ? 'HST: ' + companySettings.hst_number : ''}
          </div>
        </div>
        <div style="text-align: right; position: relative;">
          <div style="font-size: 28px; font-weight: 800;">INVOICE</div>
          <div style="color: #888; font-size: 13px;">#${invoice.invoice_number}</div>
          <div style="font-size: 13px;">Date: ${format(new Date(invoice.created_at), 'MMM dd, yyyy')}</div>
          <div style="font-size: 13px;">Due: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}</div>
          ${
            invoice.status === 'paid'
              ? `<div style="margin-top: 8px; display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700;">✓ PAID</div>`
              : ''
          }
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 24px;">
        <div style="width: 48%;">
          <strong>Bill To:</strong><br/>
          ${invoice.client_company}<br/>
          ${invoice.client_address}<br/>
          ${invoice.client_phone}<br/>
          ${invoice.client_email}
        </div>
        <div style="width: 48%;">
          <strong>Project:</strong><br/>
          ${invoice.jobsites?.name || ''}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 1px solid #ccc; padding: 8px;">Qty</th>
            <th style="text-align: left; border-bottom: 1px solid #ccc; padding: 8px;">Description</th>
            <th style="text-align: right; border-bottom: 1px solid #ccc; padding: 8px;">Unit Price</th>
            <th style="text-align: right; border-bottom: 1px solid #ccc; padding: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            invoice.invoice_line_items?.map(item => `
              <tr>
                <td style="padding: 8px;">${item.quantity}</td>
                <td style="padding: 8px;">${item.description}</td>
                <td style="padding: 8px; text-align: right;">$${item.unit_price.toFixed(2)}</td>
                <td style="padding: 8px; text-align: right;">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('') || `<tr><td colspan="4">No items</td></tr>`
          }
        </tbody>
      </table>

      <div style="margin-top: 32px; display: flex; justify-content: flex-end;">
        <table style="font-size: 14px;">
          <tr><td>Subtotal:</td><td style="text-align: right;">$${invoice.subtotal.toFixed(2)}</td></tr>
          ${invoice.discount ? `<tr><td>Discount:</td><td style="text-align: right;">-$${(invoice.subtotal * (invoice.discount / 100)).toFixed(2)}</td></tr>` : ''}
          ${invoice.tax ? `<tr><td>Tax:</td><td style="text-align: right;">$${((invoice.subtotal - (invoice.subtotal * (invoice.discount || 0) / 100)) * (invoice.tax / 100)).toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight: bold;"><td>Total:</td><td style="text-align: right;">$${invoice.total_amount.toFixed(2)}</td></tr>
        </table>
      </div>

      <div style="margin-top: 32px; text-align: center; font-size: 14px;">
        <strong>Thank you for your business!</strong><br/>
        ${companySettings.company_email || ''} | ${companySettings.company_phone || ''}
      </div>
    </div>
  `;
};

// Download PDF function
export const generateBrandedInvoicePDF = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoUrl?: string | null
) => {
  // Create a hidden div to render the invoice content as HTML
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // A4 width in pixels at 96dpi
  container.innerHTML = generateInvoiceHTML(invoice, companySettings, logoUrl);

  document.body.appendChild(container);

  // Render HTML to canvas then to PDF
  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`Invoice-${invoice.invoice_number}.pdf`);

  document.body.removeChild(container);
};

// Generate PDF as Blob for email attachments
export const generateBrandedInvoicePDFBlob = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoUrl?: string | null
): Promise<{ blob: Blob; filename: string }> => {
  // Create a hidden div to render the invoice content as HTML
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px'; // A4 width in pixels at 96dpi
  container.innerHTML = generateInvoiceHTML(invoice, companySettings, logoUrl);

  document.body.appendChild(container);

  // Render HTML to canvas then to PDF
  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
  const blob = pdf.output('blob');
  const filename = `Invoice-${invoice.invoice_number}.pdf`;

  document.body.removeChild(container);

  return { blob, filename };
};

// Helper function to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Content = base64.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
