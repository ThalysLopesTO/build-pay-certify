
import { Quote, QuoteLineItem } from '@/hooks/quotes';
import { format } from 'date-fns';

interface ConstructionTemplateProps {
  quote: Quote;
  lineItems: QuoteLineItem[];
  settings: any;
  logoUrl?: string;
}

export const generateConstructionTemplate = ({ quote, lineItems, settings, logoUrl }: ConstructionTemplateProps) => {
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
            font-family: 'Courier New', monospace;
            margin: 15px;
            color: #1a202c;
            line-height: 1.4;
            background: #fff;
          }
          .header {
            background: #2d3748;
            color: #fff;
            padding: 25px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .logo {
            max-height: 70px;
            max-width: 200px;
            filter: brightness(0) invert(1);
          }
          .company-info {
            text-align: right;
            font-size: 13px;
            font-weight: bold;
          }
          .company-name {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .quote-title {
            background: #e53e3e;
            color: white;
            padding: 15px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            letter-spacing: 2px;
          }
          .project-banner {
            background: #fed7d7;
            border: 2px solid #e53e3e;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
          }
          .project-name {
            font-size: 18px;
            font-weight: bold;
            color: #1a202c;
          }
          .quote-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }
          .info-section {
            border: 2px solid #2d3748;
            padding: 15px;
            background: #f7fafc;
          }
          .section-header {
            background: #2d3748;
            color: white;
            padding: 8px 12px;
            margin: -15px -15px 15px -15px;
            font-weight: bold;
            font-size: 14px;
          }
          .info-row {
            margin-bottom: 6px;
            font-size: 13px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
            color: #2d3748;
          }
          .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 3px solid #2d3748;
            font-size: 13px;
          }
          .line-items-table th {
            background: #2d3748;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            border-right: 1px solid #4a5568;
          }
          .line-items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #cbd5e0;
            border-right: 1px solid #e2e8f0;
          }
          .line-items-table tr:nth-child(even) {
            background: #f7fafc;
          }
          .line-items-table .amount-col {
            text-align: right;
            font-weight: bold;
          }
          .vendor-col {
            background: #edf2f7 !important;
            font-style: italic;
          }
          .totals-section {
            margin-top: 25px;
            float: right;
            width: 300px;
          }
          .totals-container {
            border: 3px solid #2d3748;
            background: #f7fafc;
          }
          .totals-header {
            background: #2d3748;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #cbd5e0;
            font-size: 13px;
          }
          .totals-table .label-col {
            text-align: right;
            font-weight: bold;
            color: #2d3748;
          }
          .totals-table .amount-col {
            text-align: right;
            font-weight: bold;
          }
          .total-row {
            background: #e53e3e;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .total-row td {
            border-bottom: none;
          }
          .notes-section {
            clear: both;
            margin: 30px 0 20px 0;
            border: 2px solid #2d3748;
            background: #f7fafc;
          }
          .notes-header {
            background: #2d3748;
            color: white;
            padding: 10px;
            font-weight: bold;
          }
          .notes-content {
            padding: 15px;
            font-size: 13px;
          }
          .signature-section {
            margin-top: 50px;
            border: 2px solid #2d3748;
            background: #f7fafc;
          }
          .signature-header {
            background: #2d3748;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
          }
          .signature-content {
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          .signature-block {
            text-align: center;
          }
          .signature-label {
            font-weight: bold;
            margin-bottom: 15px;
            color: #2d3748;
          }
          .signature-line {
            border-bottom: 2px solid #2d3748;
            height: 35px;
            margin-bottom: 8px;
          }
          .signature-date {
            font-size: 11px;
            color: #4a5568;
          }
          .project-specs {
            background: #fff5b4;
            border: 2px dashed #d69e2e;
            padding: 15px;
            margin: 15px 0;
            font-size: 12px;
          }
          .specs-title {
            font-weight: bold;
            color: #744210;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" class="logo">` : ''}
          </div>
          <div class="company-info">
            <div class="company-name">${settings?.company_name || 'CONSTRUCTION CO.'}</div>
            <div>${settings?.company_address || ''}</div>
            <div>${settings?.company_phone || ''}</div>
            <div>${settings?.company_email || ''}</div>
          </div>
        </div>

        <div class="quote-title">PROJECT QUOTATION</div>

        <div class="project-banner">
          <div class="project-name">PROJECT: ${quote.project_name.toUpperCase()}</div>
        </div>

        <div class="quote-info">
          <div class="info-section">
            <div class="section-header">CLIENT INFORMATION</div>
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
          
          <div class="info-section">
            <div class="section-header">QUOTE DETAILS</div>
            <div class="info-row">
              <span class="info-label">Quote #:</span> ${quote.quote_number}
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span> ${format(new Date(quote.quote_date), 'MM/dd/yyyy')}
            </div>
            ${quote.expiry_date ? `
              <div class="info-row">
                <span class="info-label">Valid Until:</span> ${format(new Date(quote.expiry_date), 'MM/dd/yyyy')}
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Status:</span> ${quote.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div class="project-specs">
          <div class="specs-title">IMPORTANT CONSTRUCTION NOTES:</div>
          <div>• All materials subject to availability and current market pricing</div>
          <div>• Work to be completed according to local building codes</div>
          <div>• Client responsible for permits and inspections unless specified</div>
        </div>

        <table class="line-items-table">
          <thead>
            <tr>
              <th>DESCRIPTION / MATERIALS</th>
              <th>VENDOR/SUPPLIER</th>
              <th>QTY</th>
              <th>UNIT PRICE</th>
              <th class="amount-col">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="vendor-col">${item.vendor || 'TBD'}</td>
                <td>${item.quantity}</td>
                <td>$${item.unit_price.toFixed(2)}</td>
                <td class="amount-col">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-container">
            <div class="totals-header">PROJECT TOTALS</div>
            <table class="totals-table">
              <tr>
                <td class="label-col">SUBTOTAL:</td>
                <td class="amount-col">$${quote.subtotal.toFixed(2)}</td>
              </tr>
              ${quote.discount > 0 ? `
                <tr>
                  <td class="label-col">DISCOUNT (${quote.discount}%):</td>
                  <td class="amount-col">-$${discountAmount.toFixed(2)}</td>
                </tr>
              ` : ''}
              ${quote.tax > 0 ? `
                <tr>
                  <td class="label-col">TAX (${quote.tax}%):</td>
                  <td class="amount-col">$${taxAmount.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td class="label-col">TOTAL AMOUNT:</td>
                <td class="amount-col">$${quote.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        ${quote.notes ? `
          <div class="notes-section">
            <div class="notes-header">PROJECT NOTES & SPECIFICATIONS</div>
            <div class="notes-content">${quote.notes}</div>
          </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-header">AUTHORIZATION SIGNATURES</div>
          <div class="signature-content">
            <div class="signature-block">
              <div class="signature-label">CLIENT APPROVAL</div>
              <div class="signature-line"></div>
              <div class="signature-date">DATE: ___________</div>
            </div>
            <div class="signature-block">
              <div class="signature-label">CONTRACTOR</div>
              <div class="signature-line"></div>
              <div class="signature-date">DATE: ___________</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
