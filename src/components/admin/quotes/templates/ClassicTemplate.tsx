
import { Quote, QuoteLineItem } from '@/hooks/quotes';

interface ClassicTemplateProps {
  quote: Quote;
  lineItems: QuoteLineItem[];
  settings: any;
  logoUrl?: string;
}

export const generateClassicTemplate = ({ quote, lineItems, settings, logoUrl }: ClassicTemplateProps) => {
  const discountAmount = quote.subtotal * (quote.discount / 100);
  const taxAmount = (quote.subtotal - discountAmount) * (quote.tax / 100);
  const total = quote.subtotal - discountAmount + taxAmount;

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="Company Logo" style="max-height: 60px; margin-bottom: 20px;" />`
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
          font-family: 'Times New Roman', serif;
          margin: 40px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .info-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        table {
          width: 100%;
          margin-top: 30px;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px;
        }
        th {
          background-color: #f2f2f2;
          text-align: left;
        }
        .totals {
          text-align: right;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoSection}
        <h1>Construction Quote</h1>
      </div>

      <div class="info-section">
        <div>
          <strong>${settings.companyName}</strong><br />
          ${settings.address}<br />
          ${settings.phone}<br />
          ${settings.email}
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
        <strong>Expiry Date:</strong> ${quote.expiry_date}
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

      <div style="margin-top: 50px;">
        <p>Thank you for your business!</p>
        <p>__________________________</p>
        <p>Authorized Signature</p>
      </div>
    </body>
  </html>
  `;
};
