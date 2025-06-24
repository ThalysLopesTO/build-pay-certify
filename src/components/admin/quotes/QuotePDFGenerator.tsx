import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { Quote, useQuoteLineItems } from '@/hooks/quotes';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

interface QuotePDFGeneratorProps {
  quote: Quote;
}

const QuotePDFGenerator: React.FC<QuotePDFGeneratorProps> = ({ quote }) => {
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { data: lineItems = [] } = useQuoteLineItems(quote.id);

  const generateQuoteHTML = () => {
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
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.4;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .logo {
              max-height: 80px;
              max-width: 250px;
            }
            .company-info {
              text-align: right;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
            }
            .quote-title {
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              color: #374151;
            }
            .quote-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .client-info, .quote-details {
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 5px;
            }
            .info-value {
              margin-bottom: 10px;
            }
            .line-items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .line-items-table th,
            .line-items-table td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
            }
            .line-items-table th {
              background-color: #f3f4f6;
              font-weight: bold;
              color: #374151;
            }
            .line-items-table .amount-col {
              text-align: right;
            }
            .totals-section {
              margin-top: 20px;
              float: right;
              width: 300px;
            }
            .totals-table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 8px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .totals-table .label-col {
              text-align: right;
              font-weight: bold;
            }
            .totals-table .amount-col {
              text-align: right;
            }
            .total-row {
              background-color: #1f2937;
              color: white;
              font-weight: bold;
              font-size: 16px;
            }
            .notes-section {
              clear: both;
              margin: 40px 0 20px 0;
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .signature-section {
              margin-top: 60px;
              padding: 20px 0;
              border-top: 1px solid #e5e7eb;
            }
            .signature-line {
              border-bottom: 1px solid #9ca3af;
              width: 300px;
              margin: 10px 0;
              height: 40px;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-inside: avoid; }
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

          <div class="quote-title">QUOTE</div>

          <div class="quote-info">
            <div class="client-info">
              <h3>Bill To:</h3>
              <div class="info-label">Client:</div>
              <div class="info-value">${quote.client_name}</div>
              ${quote.client_company ? `
                <div class="info-label">Company:</div>
                <div class="info-value">${quote.client_company}</div>
              ` : ''}
              <div class="info-label">Email:</div>
              <div class="info-value">${quote.client_email}</div>
              ${quote.client_phone ? `
                <div class="info-label">Phone:</div>
                <div class="info-value">${quote.client_phone}</div>
              ` : ''}
              ${quote.client_address ? `
                <div class="info-label">Address:</div>
                <div class="info-value">${quote.client_address}</div>
              ` : ''}
            </div>
            
            <div class="quote-details">
              <div class="info-label">Quote #:</div>
              <div class="info-value">${quote.quote_number}</div>
              <div class="info-label">Project:</div>
              <div class="info-value">${quote.project_name}</div>
              <div class="info-label">Quote Date:</div>
              <div class="info-value">${format(new Date(quote.quote_date), 'MMM dd, yyyy')}</div>
              ${quote.expiry_date ? `
                <div class="info-label">Expires:</div>
                <div class="info-value">${format(new Date(quote.expiry_date), 'MMM dd, yyyy')}</div>
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
              <h3>Notes:</h3>
              <p>${quote.notes}</p>
            </div>
          ` : ''}

          <div class="signature-section">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
              <div>
                <p><strong>Client Signature:</strong></p>
                <div class="signature-line"></div>
                <p style="margin-top: 5px; font-size: 12px;">Date: ___________</p>
              </div>
              <div>
                <p><strong>Company Representative:</strong></p>
                <div class="signature-line"></div>
                <p style="margin-top: 5px; font-size: 12px;">Date: ___________</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadPDF = () => {
    const htmlContent = generateQuoteHTML();
    const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, '')}.pdf`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={downloadPDF}
      className="h-8 w-8 p-0"
      title="Download quote PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default QuotePDFGenerator;
