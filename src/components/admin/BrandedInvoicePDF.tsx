import { format } from 'date-fns';
import { Invoice } from './types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';

export const generateBrandedInvoicePDF = (
  invoice: Invoice,
  companySettings: CompanySettings,
  logoUrl?: string | null
) => {
  const watermark =
    invoice.status === 'PAID' || invoice.status === 'DRAFT'
      ? invoice.status.toUpperCase()
      : '';

  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        @page {
          size: A4;
          margin: 1in;
        }
        body {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #1a1a1a;
          position: relative;
          background: white;
        }
        .watermark {
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 80px;
          color: rgba(0, 0, 0, 0.07);
          font-weight: bold;
          z-index: 0;
          pointer-events: none;
          white-space: nowrap;
        }
        .container {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: auto;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 48px;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 24px;
        }
        .company-logo {
          max-width: 180px;
          max-height: 70px;
          object-fit: contain;
          margin-bottom: 8px;
        }
        .company-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .company-details, .invoice-meta {
          color: #6b7280;
        }
        .invoice-title {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 8px;
          text-align: right;
        }
        .bill-to-section {
          display: flex;
          gap: 32px;
          margin-bottom: 32px;
        }
        .bill-to, .invoice-details {
          flex: 1;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .section-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .line-items {
          width: 100%;
          border-collapse: collapse;
          margin: 32px 0;
        }
        .line-items th, .line-items td {
          padding: 12px 16px;
          border: 1px solid #e5e5e5;
        }
        .line-items th {
          background: #f3f3f3;
          text-align: left;
          font-weight: 700;
        }
        .summary {
          margin-top: 32px;
          display: flex;
          justify-content: flex-end;
        }
        .summary-box {
          min-width: 280px;
          padding: 16px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #fff;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .total-row {
          font-weight: bold;
          border-top: 2px solid #e5e5e5;
          padding-top: 12px;
          margin-top: 12px;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          margin-top: 48px;
          padding-top: 16px;
          border-top: 2px solid #e5e5e5;
        }
        .footer strong {
          color: #000;
        }
      </style>
    </head>
    <body>
      ${
        watermark
          ? `<div class="watermark">${watermark}</div>`
          : ''
      }

      <div class="container">
        <div class="header">
          <div>
            ${
              logoUrl
                ? `<img src="${logoUrl}" alt="Logo" class="company-logo"/>`
                : ''
            }
            <div class="company-name">${companySettings.company_name}</div>
            <div class="company-details">
              ${companySettings.company_address || ''}<br/>
              ${companySettings.company_phone ? 'Phone: ' + companySettings.company_phone + '<br/>' : ''}
              ${companySettings.company_email ? 'Email: ' + companySettings.company_email + '<br/>' : ''}
              ${companySettings.hst_number ? 'HST: ' + companySettings.hst_number : ''}
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">INVOICE</div>
            <div>Invoice #: ${invoice.invoice_number}</div>
            <div>Date: ${format(new Date(invoice.created_at), 'MMMM dd, yyyy')}</div>
            <div>Due Date: ${format(new Date(invoice.due_date), 'MMMM dd, yyyy')}</div>
          </div>
        </div>

        <div class="bill-to-section">
          <div class="bill-to">
            <div class="section-title">Bill To</div>
            <div><strong>${invoice.client_company}</strong></div>
            <div>${invoice.client_address}</div>
            <div>${invoice.client_phone}</div>
            <div>${invoice.client_email}</div>
          </div>
          <div class="invoice-details">
            <div class="section-title">Invoice Details</div>
            <div>Title: ${invoice.title}</div>
            <div>Status: ${invoice.status}</div>
            <div>Project: ${invoice.jobsites?.name || ''}</div>
          </div>
        </div>

        <table class="line-items">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Description</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoice.invoice_line_items?.map(item => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${item.description}</td>
                  <td>$${item.unit_price.toLocaleString('en-CA', {minimumFractionDigits: 2})}</td>
                  <td>$${item.amount.toLocaleString('en-CA', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items</td></tr>'
            }
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>$${invoice.subtotal.toLocaleString('en-CA', {minimumFractionDigits: 2})}</span>
            </div>
            ${
              invoice.discount ? `
              <div class="summary-row">
                <span>Discount (${invoice.discount}%):</span>
                <span>-$${(invoice.subtotal * (invoice.discount / 100)).toLocaleString('en-CA', {minimumFractionDigits: 2})}</span>
              </div>` : ''
            }
            ${
              invoice.tax ? `
              <div class="summary-row">
                <span>Tax (${invoice.tax}%):</span>
                <span>$${((invoice.subtotal - (invoice.subtotal * ((invoice.discount || 0) / 100))) * (invoice.tax / 100)).toLocaleString('en-CA', {minimumFractionDigits: 2})}</span>
              </div>` : ''
            }
            <div class="summary-row total-row">
              <span>Total Due:</span>
              <span>$${invoice.total_amount.toLocaleString('en-CA', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <strong>Thank you for your business!</strong><br/>
          For questions, contact us at: <br/>
          ${companySettings.company_email || ''} | ${companySettings.company_phone || ''}
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([pdfContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice-${invoice.invoice_number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
