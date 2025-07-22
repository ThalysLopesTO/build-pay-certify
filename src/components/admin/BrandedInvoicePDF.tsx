
import React from 'react';
import { format } from 'date-fns';
import { Invoice } from './types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';

interface BrandedInvoicePDFProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  logoUrl?: string | null;
}

export const generateBrandedInvoicePDF = (invoice: Invoice, companySettings: CompanySettings, logoUrl?: string | null) => {
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 1in;
        }
        
        * {
          box-sizing: border-box;
        }

        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif; 
          margin: 0; 
          padding: 0;
          color: #1a1a1a;
          font-size: 14px;
          line-height: 1.5;
          background: white;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }

        /* Header Section */
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 48px;
          padding-bottom: 24px;
          border-bottom: 2px solid #e5e5e5;
        }

        .company-section {
          flex: 1;
          max-width: 60%;
        }

        .company-logo {
          max-width: 200px;
          max-height: 70px;
          object-fit: contain;
          margin-bottom: 16px;
        }

        .company-name { 
          font-size: 24px; 
          font-weight: 700; 
          color: #1a1a1a; 
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }

        .company-details {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }

        .invoice-meta {
          text-align: right;
          flex: 1;
          max-width: 40%;
        }

        .invoice-title { 
          font-size: 36px; 
          font-weight: 800; 
          color: #1a1a1a; 
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }

        .invoice-number { 
          font-size: 16px; 
          color: #6b7280; 
          font-weight: 600;
          margin-bottom: 16px;
        }

        .invoice-dates {
          font-size: 14px;
          color: #6b7280;
        }

        .date-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .date-label {
          font-weight: 600;
          min-width: 80px;
        }

        /* Bill To Section */
        .bill-to-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 48px;
        }

        .bill-to, .invoice-details {
          padding: 24px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #fafafa;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .client-name {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .client-details {
          color: #6b7280;
          line-height: 1.6;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .detail-label {
          font-weight: 600;
          color: #6b7280;
        }

        .detail-value {
          font-weight: 600;
          color: #1a1a1a;
        }

        /* Line Items Table */
        .line-items { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 32px 0;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .line-items thead {
          background: #f4f4f4;
        }

        .line-items th { 
          padding: 16px 20px; 
          text-align: left; 
          font-weight: 700;
          font-size: 14px;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e5e5e5;
        }

        .line-items th:last-child,
        .line-items td:last-child {
          text-align: right;
        }

        .line-items td { 
          padding: 16px 20px; 
          border-bottom: 1px solid #f0f0f0;
          color: #1a1a1a;
        }

        .line-items tbody tr:nth-child(even) {
          background: #fafafa;
        }

        .line-items tbody tr:hover {
          background: #f5f5f5;
        }

        .qty-cell {
          width: 80px;
          text-align: center;
        }

        .price-cell {
          width: 120px;
          font-weight: 600;
        }

        /* Summary Section */
        .summary {
          margin-top: 48px;
          display: flex;
          justify-content: flex-end;
        }

        .summary-box { 
          min-width: 300px;
          padding: 24px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .summary-row:last-child {
          margin-bottom: 0;
        }

        .summary-label {
          font-weight: 600;
          color: #6b7280;
        }

        .summary-value {
          font-weight: 700;
          color: #1a1a1a;
        }

        .total-row {
          border-top: 2px solid #e5e5e5;
          padding-top: 16px;
          margin-top: 16px;
          font-size: 18px;
        }

        .total-row .summary-label,
        .total-row .summary-value {
          color: #1a1a1a;
          font-weight: 800;
        }

        /* Notes Section */
        .notes-section {
          margin-top: 48px;
          padding: 24px;
          background: #fafafa;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .notes-title {
          font-weight: 700;
          margin-bottom: 12px;
          color: #1a1a1a;
          font-size: 16px;
        }

        .notes-content {
          color: #6b7280;
          line-height: 1.6;
        }

        /* Footer */
        .footer {
          margin-top: 64px;
          padding: 32px 0;
          border-top: 2px solid #e5e5e5;
          text-align: center;
        }

        .footer-thank-you {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .footer-contact {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
        }

        .contact-info {
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 8px;
        }

        /* Print Optimization */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-section">
            ${logoUrl ? 
              `<img src="${logoUrl}" alt="Company Logo" class="company-logo" />` : 
              ''
            }
            <div class="company-name">${companySettings.company_name || 'Company Name'}</div>
            <div class="company-details">
              ${companySettings.company_address ? `<div>${companySettings.company_address}</div>` : ''}
              ${companySettings.company_phone ? `<div>Phone: ${companySettings.company_phone}</div>` : ''}
              ${companySettings.company_email ? `<div>Email: ${companySettings.company_email}</div>` : ''}
              ${companySettings.hst_number ? `<div>HST #: ${companySettings.hst_number}</div>` : ''}
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#${invoice.invoice_number}</div>
            <div class="invoice-dates">
              <div class="date-row">
                <span class="date-label">Invoice Date:</span>
                <span>${format(new Date(invoice.created_at), 'MMM dd, yyyy')}</span>
              </div>
              <div class="date-row">
                <span class="date-label">Due Date:</span>
                <span>${format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bill To Section -->
        <div class="bill-to-section">
          <div class="bill-to">
            <div class="section-title">Bill To</div>
            <div class="client-name">${invoice.client_company || 'Client Name'}</div>
            <div class="client-details">
              ${invoice.client_address ? `<div>${invoice.client_address}</div>` : ''}
              ${invoice.client_phone ? `<div>Phone: ${invoice.client_phone}</div>` : ''}
              ${invoice.client_email ? `<div>Email: ${invoice.client_email}</div>` : ''}
              ${invoice.jobsites?.name ? `<div>Project: ${invoice.jobsites.name}</div>` : ''}
            </div>
          </div>
          <div class="invoice-details">
            <div class="section-title">Invoice Details</div>
            <div class="detail-row">
              <span class="detail-label">Invoice Title:</span>
              <span class="detail-value">${invoice.title || 'Service Invoice'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${invoice.status?.toUpperCase() || 'PENDING'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount Due:</span>
              <span class="detail-value">$${invoice.total_amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD</span>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="line-items">
          <thead>
            <tr>
              <th style="width: 80px;">Qty</th>
              <th>Description</th>
              <th style="width: 120px;">Unit Price</th>
              <th style="width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoice_line_items && invoice.invoice_line_items.length > 0 ? 
              invoice.invoice_line_items.map((item: any) => `
                <tr>
                  <td class="qty-cell">${item.quantity || 1}</td>
                  <td>${item.description || 'Service Item'}</td>
                  <td class="price-cell">$${(item.unit_price || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="price-cell">$${(item.amount || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('') : 
              `<tr><td colspan="4" style="text-align: center; color: #6b7280; padding: 32px;">No line items available</td></tr>`
            }
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span class="summary-label">Subtotal:</span>
              <span class="summary-value">$${invoice.subtotal.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            ${invoice.discount && invoice.discount > 0 ? `
              <div class="summary-row">
                <span class="summary-label">Discount (${invoice.discount}%):</span>
                <span class="summary-value">-$${(invoice.subtotal * (invoice.discount / 100)).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            ${invoice.tax && invoice.tax > 0 ? `
              <div class="summary-row">
                <span class="summary-label">Tax (${invoice.tax}%):</span>
                <span class="summary-value">$${((invoice.subtotal - (invoice.subtotal * ((invoice.discount || 0) / 100))) * (invoice.tax / 100)).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="summary-row total-row">
              <span class="summary-label">Total Amount Due:</span>
              <span class="summary-value">$${invoice.total_amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${invoice.notes ? `
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-thank-you">Thank you for your business!</div>
          <div class="footer-contact">
            For questions about this invoice, please contact us:
            <div class="contact-info">
              ${companySettings.company_email ? `Email: ${companySettings.company_email}` : ''}
              ${companySettings.company_phone ? ` • Phone: ${companySettings.company_phone}` : ''}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create and download PDF
  const blob = new Blob([pdfContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoice_number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
