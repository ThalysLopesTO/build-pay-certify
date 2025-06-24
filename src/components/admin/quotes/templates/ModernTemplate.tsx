
import { Quote, QuoteLineItem } from '@/hooks/quotes';

interface ClassicTemplateProps {
  quote: Quote;
  lineItems: QuoteLineItem[];
  settings: any;
  logoUrl?: string;
}

export const generateModernTemplate = ({ quote, lineItems, settings, logoUrl }: ClassicTemplateProps) => {
  const discountAmount = quote.subtotal * (quote.discount / 100);
  const taxAmount = (quote.subtotal - discountAmount) * (quote.tax / 100);
  const total = quote.subtotal - discountAmount + taxAmount;

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="Company Logo" style="max-height: 50px;" />`
    : '';

  const lineItemsHTML = lineItems.map(item => `
    <tr>
      <td>${item.description}</td>
      <td align="center">${item.quantity}</td>
      <td align="right">$${item.unit_price.toFixed(2)}</td>
      <td align="right">$${(item.quantity * item.unit_price).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Quote - ${quote.quote_number}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 40px;
          color: #1a1a1a;
          background-color: #fff;
        }
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        h1 {
          font-size: 28px;
          margin: 0;
          color: #007bff;
        }
        .info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info div {
          width: 48%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #f0f0f0;
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #ccc;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .totals {
          margin-top: 30px;
          text-align: right;
        }
        .totals p {
          margin: 5px 0;
        }
        .footer {
          margin-top: 50px;
          font-size: 13px;
          color: #888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="top-bar">
        ${logoSection}
        <h1>Quote</h1>
      </div>

      <div class="info">
        <div>
          <strong>${settings?.companyName || 'Company Name'}</strong><br />
          ${settings?.address || ''}<br />
          ${settings?.phone || ''}<br />
          ${settings?.email || ''}
        </div>
        <div>
          <strong>Client:</strong><br />
          ${quote.client_name}<br />
          ${quote.client_company || ''}<br />
          ${quote.client_email}<br />
          ${quote.client_phone || ''}
        </div>
      </div>

      <div style="margin-top: 30px;">
        <strong>Project:</strong> ${quote.project_name}<br />
        <strong>Quote Date:</strong> ${quote.quote_date}<br />
        <strong>Expiry Date:</strong> ${quote.expiry_date || 'N/A'}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <p><strong>Subtotal:</strong> $${quote.subtotal.toFixed(2)}</p>
        <p><strong>Discount:</strong> -$${discountAmount.toFixed(2)}</p>
        <p><strong>Tax:</strong> $${taxAmount.toFixed(2)}</p>
        <p><strong>Total:</strong> <span style="font-size: 18px;">$${total.toFixed(2)}</span></p>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>__________________________</p>
        <p>Authorized Signature</p>
      </div>
    </body>
  </html>
  `;
};
