
import { Quote, QuoteLineItem } from '@/hooks/quotes';
import { format } from 'date-fns';

interface ClassicTemplateProps {
  quote: Quote;
  lineItems: QuoteLineItem[];
  settings: any;
  logoUrl?: string;
}

export const generateClassicTemplate = ({ quote, lineItems, settings, logoUrl }: ClassicTemplateProps) => {
  const discountAmount = quote.subtotal * (quote.discount / 100);
  const taxAmount = (quote.subtotal - discountAmount) * (quote.tax / 100);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Quote - ${quote.quote_number}</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #000;
          }
          .logo {
            max-height: 80px;
            max-width: 250px;
          }
          .company-info {
            text-align: right;
            font-size: 14px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
          }
          .quote-title {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            color: #000;
            letter-spacing: 2px;
          }
          .quote-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .client-info, .quote-details {
            padding: 20px;
            border: 1px solid #ddd;
          }
          .section-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 15px;
            color: #000;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .info-row {
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
          }
          .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            border: 2px solid #000;
          }
          .line-items-table th,
          .line-items-table td {
            border: 1px solid #000;
            padding: 12px;
            text-align: left;
          }
          .line-items-table th {
            background-color: #f8f8f8;
            font-weight: bold;
            font-size: 14px;
          }
          .line-items-table .amount-col {
            text-align: right;
          }
          .totals-section {
            margin-top: 30px;
            float: right;
            width: 350px;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
          }
          .totals-table td {
            padding: 10px;
            border: 1px solid #000;
          }
          .totals-table .label-col {
            text-align: right;
            font-weight: bold;
            background-color: #f8f8f8;
          }
          .totals-table .amount-col {
            text-align: right;
            width: 120px;
          }
          .total-row {
            background-color: #000;
            color: white;
            font-weight: bold;
            font-size: 16px;
          }
          .notes-section {
            clear: both;
            margin: 50px 0 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .signature-section {
            margin-top: 80px;
            padding: 30px 0;
            border-top: 2px solid #000;
          }
          .signature-line {
            border-bottom: 2px solid #000;
            width: 250px;
            margin: 15px 0;
            height: 40px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" class="logo">` : ''}
          </div>
          <div class="company-info">
            <div class="company-name">${settings?.company_name || 'Company Name'}</div>
            <div>${settings?.company_address || ''}</div>
            <div>${settings?.company_phone || ''}</div>
            <div>${settings?.company_email || ''}</div>
          </div>
        </div>

        <div class="quote-title">QUOTATION</div>

        <div class="quote-info">
          <div class="client-info">
            <div class="section-title">Bill To:</div>
            <div class="info-row">
              <span class="info-label">Client:</span> ${quote.client_name}
            </div>
            ${quote.client_company ? `
              <div class="info-row">
                <span class="info-label">Company:</span> ${quote.client_company}
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Email:</span> ${quote.client_email}
            </div>
            ${quote.client_phone ? `
              <div class="info-row">
                <span class="info-label">Phone:</span> ${quote.client_phone}
              </div>
            ` : ''}
            ${quote.client_address ? `
              <div class="info-row">
                <span class="info-label">Address:</span> ${quote.client_address}
              </div>
            ` : ''}
          </div>
          
          <div class="quote-details">
            <div class="section-title">Quote Details:</div>
            <div class="info-row">
              <span class="info-label">Quote #:</span> ${quote.quote_number}
            </div>
            <div class="info-row">
              <span class="info-label">Project:</span> ${quote.project_name}
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span> ${format(new Date(quote.quote_date), 'MMMM dd, yyyy')}
            </div>
            ${quote.expiry_date ? `
              <div class="info-row">
                <span class="info-label">Expires:</span> ${format(new Date(quote.expiry_date), 'MMMM dd, yyyy')}
              </div>
            ` : ''}
          </div>
        </div>

        <table class="line-items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Vendor</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th class="amount-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.vendor || '--'}</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price.toFixed(2)}</td>
                <td class="amount-col">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td class="label-col">Subtotal:</td>
              <td class="amount-col">$${quote.subtotal.toFixed(2)}</td>
            </tr>
            ${quote.discount > 0 ? `
              <tr>
                <td class="label-col">Discount (${quote.discount}%):</td>
                <td class="amount-col">-$${discountAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${quote.tax > 0 ? `
              <tr>
                <td class="label-col">Tax (${quote.tax}%):</td>
                <td class="amount-col">$${taxAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td class="label-col">TOTAL:</td>
              <td class="amount-col">$${quote.total_amount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${quote.notes ? `
          <div class="notes-section">
            <div class="section-title">Notes:</div>
            <p>${quote.notes}</p>
          </div>
        ` : ''}

        <div class="signature-section">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
            <div>
              <p><strong>Client Signature:</strong></p>
              <div class="signature-line"></div>
              <p style="margin-top: 10px; font-size: 14px;">Date: ___________</p>
            </div>
            <div>
              <p><strong>Company Representative:</strong></p>
              <div class="signature-line"></div>
              <p style="margin-top: 10px; font-size: 14px;">Date: ___________</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
