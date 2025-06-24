
import { Quote, QuoteLineItem } from '@/hooks/quotes';
import { format } from 'date-fns';

interface ModernTemplateProps {
  quote: Quote;
  lineItems: QuoteLineItem[];
  settings: any;
  logoUrl?: string;
}

export const generateModernTemplate = ({ quote, lineItems, settings, logoUrl }: ModernTemplateProps) => {
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
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            color: #2d3748;
            line-height: 1.5;
            background: #f7fafc;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .logo {
            max-height: 60px;
            max-width: 200px;
            filter: brightness(0) invert(1);
          }
          .company-info {
            text-align: right;
            font-size: 14px;
          }
          .company-name {
            font-size: 24px;
            font-weight: 300;
            margin-bottom: 8px;
          }
          .quote-title {
            background: #4a5568;
            color: white;
            padding: 20px 40px;
            font-size: 28px;
            font-weight: 100;
            letter-spacing: 3px;
            text-align: center;
          }
          .content {
            padding: 40px;
          }
          .quote-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .info-card {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 25px;
            border-radius: 0 8px 8px 0;
          }
          .card-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 15px;
            color: #2d3748;
          }
          .info-row {
            margin-bottom: 8px;
            display: flex;
          }
          .info-label {
            font-weight: 500;
            color: #4a5568;
            min-width: 80px;
          }
          .info-value {
            color: #2d3748;
          }
          .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .line-items-table th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 500;
            font-size: 14px;
          }
          .line-items-table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
          }
          .line-items-table tr:last-child td {
            border-bottom: none;
          }
          .line-items-table .amount-col {
            text-align: right;
            font-weight: 500;
          }
          .totals-section {
            margin-top: 30px;
            float: right;
            width: 350px;
          }
          .totals-card {
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 12px 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals-table .label-col {
            text-align: right;
            font-weight: 500;
            color: #4a5568;
          }
          .totals-table .amount-col {
            text-align: right;
            font-weight: 600;
            color: #2d3748;
          }
          .total-row {
            background: #667eea;
            color: white;
            font-weight: 600;
            font-size: 16px;
          }
          .total-row td {
            border-bottom: none;
          }
          .notes-section {
            clear: both;
            margin: 40px 0;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #38b2ac;
          }
          .notes-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #2d3748;
          }
          .signature-section {
            margin-top: 60px;
            padding: 30px 0;
            border-top: 2px solid #e2e8f0;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
          }
          .signature-block {
            text-align: center;
          }
          .signature-label {
            font-weight: 500;
            margin-bottom: 20px;
            color: #4a5568;
          }
          .signature-line {
            border-bottom: 2px solid #cbd5e0;
            height: 40px;
            margin-bottom: 10px;
          }
          .signature-date {
            font-size: 12px;
            color: #718096;
          }
        </style>
      </head>
      <body>
        <div class="container">
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

          <div class="quote-title">QUOTE</div>

          <div class="content">
            <div class="quote-info">
              <div class="info-card">
                <div class="card-title">Bill To</div>
                <div class="info-row">
                  <span class="info-label">Client:</span>
                  <span class="info-value">${quote.client_name}</span>
                </div>
                ${quote.client_company ? `
                  <div class="info-row">
                    <span class="info-label">Company:</span>
                    <span class="info-value">${quote.client_company}</span>
                  </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${quote.client_email}</span>
                </div>
                ${quote.client_phone ? `
                  <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${quote.client_phone}</span>
                  </div>
                ` : ''}
                ${quote.client_address ? `
                  <div class="info-row">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${quote.client_address}</span>
                  </div>
                ` : ''}
              </div>
              
              <div class="info-card">
                <div class="card-title">Quote Details</div>
                <div class="info-row">
                  <span class="info-label">Quote #:</span>
                  <span class="info-value">${quote.quote_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Project:</span>
                  <span class="info-value">${quote.project_name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${format(new Date(quote.quote_date), 'MMM dd, yyyy')}</span>
                </div>
                ${quote.expiry_date ? `
                  <div class="info-row">
                    <span class="info-label">Expires:</span>
                    <span class="info-value">${format(new Date(quote.expiry_date), 'MMM dd, yyyy')}</span>
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
              <div class="totals-card">
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
            </div>

            ${quote.notes ? `
              <div class="notes-section">
                <div class="notes-title">Notes</div>
                <p>${quote.notes}</p>
              </div>
            ` : ''}

            <div class="signature-section">
              <div class="signature-grid">
                <div class="signature-block">
                  <div class="signature-label">Client Signature</div>
                  <div class="signature-line"></div>
                  <div class="signature-date">Date: ___________</div>
                </div>
                <div class="signature-block">
                  <div class="signature-label">Company Representative</div>
                  <div class="signature-line"></div>
                  <div class="signature-date">Date: ___________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
