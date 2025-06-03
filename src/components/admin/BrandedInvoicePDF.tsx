
import React from 'react';
import { format } from 'date-fns';
import { Invoice } from './types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';

interface BrandedInvoicePDFProps {
  invoice: Invoice;
  companySettings: CompanySettings;
}

export const generateBrandedInvoicePDF = (invoice: Invoice, companySettings: CompanySettings) => {
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          padding: 20px; 
          color: #333;
          line-height: 1.6;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 40px; 
          padding-bottom: 20px;
          border-bottom: 3px solid #f97316;
        }
        .company-info {
          flex: 1;
        }
        .company-name { 
          font-size: 28px; 
          font-weight: bold; 
          color: #f97316; 
          margin-bottom: 10px;
        }
        .company-details {
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }
        .invoice-info {
          text-align: right;
          flex: 1;
        }
        .invoice-title { 
          font-size: 32px; 
          font-weight: bold; 
          color: #333; 
          margin-bottom: 10px;
        }
        .invoice-number { 
          font-size: 18px; 
          color: #f97316; 
          font-weight: bold;
        }
        .client-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .client-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .invoice-details { 
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .detail-item {
          font-size: 14px;
        }
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        .line-items { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 30px 0; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .line-items th { 
          background-color: #f97316; 
          color: white; 
          padding: 15px; 
          text-align: left; 
          font-weight: bold;
          font-size: 14px;
        }
        .line-items td { 
          padding: 12px 15px; 
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        .line-items tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .totals { 
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .total-row.final {
          border-top: 2px solid #f97316;
          padding-top: 15px;
          margin-top: 15px;
          font-size: 18px;
          font-weight: bold;
          color: #f97316;
        }
        .notes-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #fff7ed;
          border-left: 4px solid #f97316;
          border-radius: 0 8px 8px 0;
        }
        .notes-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #f97316;
        }
        .footer {
          margin-top: 50px;
          padding: 20px 0;
          border-top: 2px solid #f97316;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .footer-thank-you {
          font-size: 18px;
          font-weight: bold;
          color: #f97316;
          margin-bottom: 10px;
        }
        .amount-due {
          background-color: #f97316;
          color: white;
          padding: 10px 15px;
          border-radius: 6px;
          font-weight: bold;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${companySettings.company_name}</div>
          <div class="company-details">
            ${companySettings.company_address ? `<div>${companySettings.company_address}</div>` : ''}
            ${companySettings.company_phone ? `<div>Phone: ${companySettings.company_phone}</div>` : ''}
            ${companySettings.company_email ? `<div>Email: ${companySettings.company_email}</div>` : ''}
            ${companySettings.hst_number ? `<div>HST: ${companySettings.hst_number}</div>` : ''}
          </div>
        </div>
        <div class="invoice-info">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">${invoice.invoice_number}</div>
          <div style="margin-top: 10px; font-size: 14px;">
            <div>Date: ${format(new Date(invoice.created_at), 'MMM dd, yyyy')}</div>
            <div>Due: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}</div>
          </div>
        </div>
      </div>

      <div class="client-section">
        <div class="client-title">Bill To:</div>
        <div><strong>${invoice.client_company}</strong></div>
        <div>${invoice.client_email}</div>
        ${invoice.jobsites?.name ? `<div>Project: ${invoice.jobsites.name}</div>` : ''}
      </div>

      <div class="invoice-details">
        <div class="detail-item">
          <div class="detail-label">Invoice Title:</div>
          <div>${invoice.title}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Amount Due:</div>
          <div class="amount-due">$${invoice.total_amount.toFixed(2)}</div>
        </div>
      </div>

      <table class="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right; width: 150px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.invoice_line_items?.map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('') || '<tr><td colspan="2" style="text-align: center; color: #666;">No line items</td></tr>'}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${invoice.subtotal.toFixed(2)}</span>
        </div>
        ${invoice.discount > 0 ? `
          <div class="total-row">
            <span>Discount (${invoice.discount}%):</span>
            <span>-$${(invoice.subtotal * (invoice.discount / 100)).toFixed(2)}</span>
          </div>
        ` : ''}
        ${invoice.tax > 0 ? `
          <div class="total-row">
            <span>Tax (${invoice.tax}%):</span>
            <span>$${((invoice.subtotal - (invoice.subtotal * (invoice.discount / 100))) * (invoice.tax / 100)).toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row final">
          <span>Total Amount Due:</span>
          <span>$${invoice.total_amount.toFixed(2)}</span>
        </div>
      </div>

      ${invoice.notes ? `
        <div class="notes-section">
          <div class="notes-title">Notes:</div>
          <div>${invoice.notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div class="footer-thank-you">Thank you for your business!</div>
        <div>If you have any questions about this invoice, please contact us at:</div>
        <div>${companySettings.company_email || companySettings.company_phone || companySettings.company_name}</div>
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
