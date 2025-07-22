// utils/invoicePDF.ts

import { format } from 'date-fns';
import { Invoice } from './types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';
import html2pdf from 'html2pdf.js';

const getBase64FromUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();

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
  const logoBase64 = logoUrl ? await getBase64FromUrl(logoUrl) : null;

  const container = document.createElement('div');
  container.style.padding = '24px';
  container.innerHTML = `
    <div style="font-family: Inter, sans-serif; color: #1a1a1a; font-size: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eee; padding-bottom: 16px; margin-bottom: 32px;">
        <div>
          ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" style="max-height: 60px; margin-bottom: 8px;" />` : ''}
          <h2 style="margin: 0; font-size: 24px;">${companySettings.company_name || 'Company Name'}</h2>
          <div style="color: #6b7280;">
            ${companySettings.company_address || ''}<br/>
            Phone: ${companySettings.company_phone || ''}<br/>
            Email: ${companySettings.company_email || ''}<br/>
            HST #: ${companySettings.hst_number || ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h1 style="margin: 0; font-size: 32px;">INVOICE</h1>
          <div style="color: #6b7280; font-weight: 600;">#${invoice.invoice_number}</div>
          <div style="color: #6b7280;">
            <strong>Date:</strong> ${format(new Date(invoice.created_at), 'MMM dd, yyyy')}<br/>
            <strong>Due:</strong> ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
        <div style="width: 45%;">
          <strong>Bill To</strong><br/>
          <div style="color: #1a1a1a;">
            ${invoice.client_company || ''}<br/>
            ${invoice.client_address || ''}<br/>
            Phone: ${invoice.client_phone || ''}<br/>
            Email: ${invoice.client_email || ''}
          </div>
        </div>
        <div style="width: 45%;">
          <strong>Invoice Details</strong><br/>
          <div style="color: #1a1a1a;">
            Title: ${invoice.title || ''}<br/>
            Status: ${invoice.status || 'PENDING'}<br/>
            Project: ${invoice.jobsites?.name || 'N/A'}<br/>
            Total Due: $${invoice.total_amount.toFixed(2)} CAD
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <thead>
          <tr style="background: #f4f4f4;">
            <th style="padding: 8px; border: 1px solid #ccc;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Description</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Unit Price</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            invoice.invoice_line_items?.length
              ? invoice.invoice_line_items.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${item.quantity || 1}</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${item.description}</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">$${(item.unit_price || 0).toFixed(2)}</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">$${(item.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')
              : `<tr><td colspan="4" style="padding: 16px; text-align: center;">No items listed</td></tr>`
          }
        </tbody>
      </table>

      <div style="text-align: right; margin-bottom: 24px;">
        <div>Subtotal: <strong>$${invoice.subtotal.toFixed(2)}</strong></div>
        ${invoice.discount ? `<div>Discount (${invoice.discount}%): <strong>-$${(invoice.subtotal * (invoice.discount / 100)).toFixed(2)}</strong></div>` : ''}
        ${invoice.tax ? `<div>Tax (${invoice.tax}%): <strong>$${(((invoice.subtotal - (invoice.subtotal * ((invoice.discount || 0) / 100))) * (invoice.tax / 100))).toFixed(2)}</strong></div>` : ''}
        <div style="font-size: 18px; margin-top: 8px;">Total Due: <strong>$${invoice.total_amount.toFixed(2)} CAD</strong></div>
      </div>

      ${invoice.notes ? `
        <div style="background: #f9fafb; padding: 16px; border-left: 4px solid #3b82f6; margin-bottom: 32px;">
          <strong>Notes:</strong><br/>${invoice.notes}
        </div>
      ` : ''}

      <div style="border-top: 1px solid #eee; padding-top: 16px; text-align: center; color: #6b7280; font-size: 13px;">
        Thank you for your business!<br/>
        Contact us: ${companySettings.company_email || ''} • ${companySettings.company_phone || ''}
      </div>
    </div>
  `;

  html2pdf().set({
    margin: 10,
    filename: `Invoice_${invoice.invoice_number}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(container).save();
};
