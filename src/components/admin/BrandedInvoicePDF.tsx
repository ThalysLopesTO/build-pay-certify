import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { Invoice } from './types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';

const getBase64FromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url, { mode: 'cors' });
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateBrandedInvoicePDF = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoUrl?: string | null
) => {
  let base64Logo = '';

  try {
    if (logoUrl) {
      base64Logo = await getBase64FromUrl(logoUrl);
    }
  } catch (error) {
    console.warn('Failed to load logo:', error);
  }

  const container = document.createElement('div');
  container.innerHTML = `
    <div style="font-family: Inter, sans-serif; padding: 24px; font-size: 14px; color: #1a1a1a;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          ${base64Logo ? `<img src="${base64Logo}" style="max-height: 70px; margin-bottom: 8px;" />` : ''}
          <h2 style="margin: 0;">${companySettings.company_name}</h2>
          <div style="color: #6b7280;">
            ${companySettings.company_address}<br/>
            Phone: ${companySettings.company_phone}<br/>
            Email: ${companySettings.company_email}<br/>
            ${companySettings.hst_number ? `HST: ${companySettings.hst_number}` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h1 style="margin: 0;">INVOICE</h1>
          <div style="color: #6b7280;">#${invoice.invoice_number}</div>
          <div>${format(new Date(invoice.created_at), 'MMMM dd, yyyy')}</div>
          <div>Due: ${format(new Date(invoice.due_date), 'MMMM dd, yyyy')}</div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <strong>Bill To:</strong><br/>
        ${invoice.client_company}<br/>
        ${invoice.client_address}<br/>
        Phone: ${invoice.client_phone}<br/>
        Email: ${invoice.client_email}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead style="background: #f4f4f4;">
          <tr>
            <th style="padding: 8px; border: 1px solid #ccc;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Description</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Unit Price</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.invoice_line_items.map(item => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;">${item.quantity}</td>
              <td style="padding: 8px; border: 1px solid #ccc;">${item.description}</td>
              <td style="padding: 8px; border: 1px solid #ccc;">$${item.unit_price.toFixed(2)}</td>
              <td style="padding: 8px; border: 1px solid #ccc;">$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; margin-bottom: 24px;">
        <div>Subtotal: <strong>$${invoice.subtotal.toFixed(2)}</strong></div>
        <div>Tax (${invoice.tax}%): <strong>$${((invoice.subtotal - (invoice.subtotal * (invoice.discount || 0) / 100)) * (invoice.tax / 100)).toFixed(2)}</strong></div>
        <div style="font-size: 18px;">Total: <strong>$${invoice.total_amount.toFixed(2)}</strong></div>
      </div>

      <div style="text-align: center; font-size: 13px; color: #6b7280;">
        Thank you for your business!<br/>
        For questions, contact ${companySettings.company_email} • ${companySettings.company_phone}
      </div>
    </div>
  `;

  html2pdf().set({
    margin: 0,
    filename: `Invoice_${invoice.invoice_number}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(container).save();
};
