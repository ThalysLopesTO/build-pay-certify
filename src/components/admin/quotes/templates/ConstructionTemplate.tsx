import { Quote, QuoteLineItem } from '@/hooks/quotes';

interface ClassicTemplateProps {
  quote: Quote;
  lineItems: QuoteLineItem[];
  settings: any;
  logoUrl?: string;
}

export const generateConstructionTemplate = ({ quote, lineItems, settings, logoUrl }: ClassicTemplateProps) => {
  const discountType = quote.discount_type || 'fixed';
  const discountAmount = discountType === 'percentage'
    ? (quote.subtotal * (quote.discount || 0)) / 100
    : (quote.discount || 0);
  const taxAmount = (quote.subtotal - discountAmount) * (quote.tax / 100);
  const total = quote.subtotal - discountAmount + taxAmount;

  const discountLabel = discountType === 'percentage' 
    ? `Discount (${quote.discount}%)` 
    : 'Discount';

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="Company Logo" style="max-height: 60px;" />`
    : '';

  const lineItemsHTML = lineItems.map(item => `
    <tr>
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>$${item.unit_price.toFixed(2)}</td>
      <td>$${(item.quantity * item.unit_price).toFixed(2)}</td>
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
          font-family: 'Segoe UI', sans-serif;
          margin: 40px;
          color: #222;
          background-color: #fff;
        }
        header {
          border-bottom: 4px solid #444;
          padding-bottom: 10px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h1 {
          font-size: 26px;
          color: #444;
        }
        .details {
          margin-bottom: 20px;
        }
        .details div {
          margin-bottom: 8px;
        }
        .quote-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .quote-meta div {
          width: 48%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #e0e0e0;
          padding: 10px;
          border: 1px solid #ccc;
        }
        td {
          padding: 10px;
          border: 1px solid #eee;
        }
        .summary {
          text-align: right;
          margin-top: 30px;
        }
        .summary p {
          margin: 5px 0;
          font-size: 15px;
        }
        .summary strong {
          font-size: 17px;
        }
        footer {
          margin-top: 50px;
          font-size: 13px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      <header>
        ${logoSection}
        <h1>PROJECT QUOTE</h1>
      </header>

      <div class="quote-meta">
        <div>
          <strong>FROM:</strong><br/>
          ${settings.companyName}<br/>
          ${settings.address}<br/>
          ${settings.phone}<br/>
          ${settings.email}
        </div>
        <div>
          <strong>TO:</strong><br/>
          ${quote.client_name}<br/>
          ${quote.client_company || ''}<br/>
          ${quote.client_email}<br/>
          ${quote.client_phone || ''}
        </div>
      </div>

      <div class="details">
        <div><strong>Quote #:</strong> ${quote.quote_number}</div>
        <div><strong>Project:</strong> ${quote.project_name}</div>
        <div><strong>Quote Date:</strong> ${quote.quote_date}</div>
        <div><strong>Expiry Date:</strong> ${quote.expiry_date}</div>
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

      <div class="summary">
        <p>Subtotal: $${quote.subtotal.toFixed(2)}</p>
        ${discountAmount > 0 ? `<p>${discountLabel}: -$${discountAmount.toFixed(2)}</p>` : ''}
        <p>Tax: $${taxAmount.toFixed(2)}</p>
        <p><strong>Total: $${total.toFixed(2)}</strong></p>
      </div>

      <footer>
        This quote is valid until ${quote.expiry_date}. Thank you for the opportunity to work with you.
      </footer>
    </body>
  </html>
  `;
};
