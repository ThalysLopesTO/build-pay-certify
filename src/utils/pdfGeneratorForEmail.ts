import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Invoice } from '@/components/admin/types/invoice';
import { Quote, QuoteLineItem } from '@/hooks/quotes';
import { CompanySettings } from '@/hooks/useCompanySettings';

// Generate Invoice PDF as blob for email attachment
export const generateInvoicePDFBlob = async (
  invoice: Invoice,
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<{ blob: Blob; filename: string }> => {
  try {
    // Create a temporary div to render the invoice HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '794px'; // A4 width at 96 DPI
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';

    // Generate the invoice HTML
    const invoiceHTML = await generateInvoiceHTML(invoice, companySettings, logoUrl);
    tempDiv.innerHTML = invoiceHTML;
    
    // Append to body temporarily
    document.body.appendChild(tempDiv);

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight);

    // Add watermark for non-paid invoices
    if (invoice.status !== 'paid') {
      pdf.setFontSize(50);
      pdf.setTextColor(200, 200, 200);
      pdf.text(
        invoice.status.toUpperCase(),
        pdfWidth / 2,
        pdfHeight / 2,
        { align: 'center', angle: 45 }
      );
    }

    // Get the PDF as blob
    const blob = pdf.output('blob');
    const filename = `Invoice_${invoice.invoice_number || invoice.id}.pdf`;

    return { blob, filename };
  } catch (error) {
    console.error('Error generating invoice PDF blob:', error);
    throw error;
  }
};

// Generate Quote PDF as blob for email attachment
export const generateQuotePDFBlob = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<{ blob: Blob; filename: string }> => {
  try {
    // Create a temporary div to render the quote HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '794px'; // A4 width at 96 DPI
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';

    // Generate the quote HTML
    const quoteHTML = await generateQuoteHTML(quote, lineItems, companySettings, logoUrl);
    tempDiv.innerHTML = quoteHTML;
    
    // Append to body temporarily
    document.body.appendChild(tempDiv);

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove the temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight);

    // Add watermark for non-accepted quotes
    if (quote.status !== 'accepted') {
      pdf.setFontSize(50);
      pdf.setTextColor(200, 200, 200);
      pdf.text(
        quote.status.toUpperCase(),
        pdfWidth / 2,
        pdfHeight / 2,
        { align: 'center', angle: 45 }
      );
    }

    // Get the PDF as blob
    const blob = pdf.output('blob');
    const filename = `Quote_${quote.quote_number}.pdf`;

    return { blob, filename };
  } catch (error) {
    console.error('Error generating quote PDF blob:', error);
    throw error;
  }
};

// Convert blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Invoice HTML generation (copied from invoicePDFGenerator.ts)
const generateInvoiceHTML = async (
  invoice: Invoice,
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<string> => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <div style="flex: 1;">
          ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 20px;">` : ''}
          <div style="color: #6b7280; font-size: 14px;">
            ${companySettings?.company_name ? `<p style="margin: 5px 0; font-weight: bold; color: #374151; font-size: 16px;">${companySettings.company_name}</p>` : ''}
            ${companySettings?.company_address ? `<p style="margin: 5px 0;">${companySettings.company_address}</p>` : ''}
            ${companySettings?.company_phone ? `<p style="margin: 5px 0;">Phone: ${companySettings.company_phone}</p>` : ''}
            ${companySettings?.company_email ? `<p style="margin: 5px 0;">Email: ${companySettings.company_email}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0 0 10px 0;">INVOICE</h1>
          <div style="color: #6b7280; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${invoice.invoice_number || invoice.id}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(new Date())}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
            <div style="margin-top: 10px; padding: 8px 16px; background: ${getStatusColor(invoice.status)}; color: white; border-radius: 4px; display: inline-block;">
              ${getStatusText(invoice.status)}
            </div>
          </div>
        </div>
      </div>

      <!-- Client Information -->
      <div style="margin-bottom: 40px;">
        <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Bill To:</h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 5px 0; font-weight: bold; color: #1f2937; font-size: 16px;">${invoice.client_company}</p>
          ${invoice.client_email ? `<p style="margin: 5px 0; color: #6b7280;">Email: ${invoice.client_email}</p>` : ''}
        </div>
      </div>

      <!-- Line Items -->
      <div style="margin-bottom: 40px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="text-align: left; padding: 15px; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Description</th>
              <th style="text-align: right; padding: 15px; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoice_line_items?.map(item => `
              <tr>
                <td style="padding: 15px; border: 1px solid #e5e7eb; color: #1f2937;">${item.description}</td>
                <td style="text-align: right; padding: 15px; border: 1px solid #e5e7eb; color: #1f2937;">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 300px;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span style="color: #1f2937; font-weight: 500;">${formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            ${invoice.tax ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Tax (${invoice.tax}%):</span>
                <span style="color: #1f2937;">${formatCurrency(((invoice.subtotal || 0)) * ((invoice.tax || 0) / 100))}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
              <span style="color: #1f2937;">Total:</span>
              <span style="color: #1f2937;">${formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes ? `
        <div style="margin-bottom: 40px;">
          <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Notes:</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">${invoice.notes}</p>
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="margin: 5px 0;">Thank you for your business!</p>
        ${companySettings?.company_name ? `<p style="margin: 5px 0;">© ${new Date().getFullYear()} ${companySettings.company_name}. All rights reserved.</p>` : ''}
      </div>
    </div>
  `;
};

// Quote HTML generation (copied from quotePDFGenerator.ts)
const generateQuoteHTML = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<string> => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <div style="flex: 1;">
          ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 20px;">` : ''}
          <div style="color: #6b7280; font-size: 14px;">
            ${companySettings?.company_name ? `<p style="margin: 5px 0; font-weight: bold; color: #374151; font-size: 16px;">${companySettings.company_name}</p>` : ''}
            ${companySettings?.company_address ? `<p style="margin: 5px 0;">${companySettings.company_address}</p>` : ''}
            ${companySettings?.company_phone ? `<p style="margin: 5px 0;">Phone: ${companySettings.company_phone}</p>` : ''}
            ${companySettings?.company_email ? `<p style="margin: 5px 0;">Email: ${companySettings.company_email}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0 0 10px 0;">QUOTE</h1>
          <div style="color: #6b7280; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Quote #:</strong> ${quote.quote_number}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(quote.created_at)}</p>
            <p style="margin: 5px 0;"><strong>Valid Until:</strong> ${formatDate(quote.expiry_date)}</p>
            <div style="margin-top: 10px; padding: 8px 16px; background: ${getStatusColorQuote(quote.status)}; color: white; border-radius: 4px; display: inline-block;">
              ${getStatusTextQuote(quote.status)}
            </div>
          </div>
        </div>
      </div>

      <!-- Client Information -->
      <div style="margin-bottom: 40px;">
        <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Quote For:</h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 5px 0; font-weight: bold; color: #1f2937; font-size: 16px;">${quote.client_name}</p>
          ${quote.client_company ? `<p style="margin: 5px 0; color: #6b7280;">${quote.client_company}</p>` : ''}
          ${quote.client_email ? `<p style="margin: 5px 0; color: #6b7280;">Email: ${quote.client_email}</p>` : ''}
          <p style="margin: 5px 0; font-weight: bold; color: #1f2937; margin-top: 15px;">Project: ${quote.project_name}</p>
        </div>
      </div>

      <!-- Line Items -->
      <div style="margin-bottom: 40px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="text-align: left; padding: 15px; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Description</th>
              <th style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Qty</th>
              <th style="text-align: right; padding: 15px; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Unit Price</th>
              <th style="text-align: right; padding: 15px; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td style="padding: 15px; border: 1px solid #e5e7eb; color: #1f2937;">${item.description}</td>
                <td style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; color: #1f2937;">${item.quantity}</td>
                <td style="text-align: right; padding: 15px; border: 1px solid #e5e7eb; color: #1f2937;">${formatCurrency(item.unit_price)}</td>
                <td style="text-align: right; padding: 15px; border: 1px solid #e5e7eb; color: #1f2937;">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 300px;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span style="color: #1f2937; font-weight: 500;">${formatCurrency(quote.subtotal || 0)}</span>
            </div>
            ${quote.discount ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Discount (${quote.discount}%):</span>
                <span style="color: #dc2626;">-${formatCurrency((quote.subtotal || 0) * (quote.discount / 100))}</span>
              </div>
            ` : ''}
            ${quote.tax ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Tax (${quote.tax}%):</span>
                <span style="color: #1f2937;">${formatCurrency(((quote.subtotal || 0) - ((quote.subtotal || 0) * ((quote.discount || 0) / 100))) * ((quote.tax || 0) / 100))}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
              <span style="color: #1f2937;">Total:</span>
              <span style="color: #1f2937;">${formatCurrency(quote.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${quote.notes ? `
        <div style="margin-bottom: 40px;">
          <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Notes:</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">${quote.notes}</p>
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="margin: 5px 0;">Thank you for considering our services!</p>
        ${companySettings?.company_name ? `<p style="margin: 5px 0;">© ${new Date().getFullYear()} ${companySettings.company_name}. All rights reserved.</p>` : ''}
      </div>
    </div>
  `;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid': return '#10b981';
    case 'sent': return '#3b82f6';
    case 'overdue': return '#ef4444';
    case 'draft': 
    default: return '#6b7280';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'paid': return 'PAID';
    case 'sent': return 'SENT';
    case 'overdue': return 'OVERDUE';
    case 'draft':
    default: return 'DRAFT';
  }
};

const getStatusColorQuote = (status: string): string => {
  switch (status) {
    case 'accepted': return '#10b981';
    case 'sent': return '#3b82f6';
    case 'declined': return '#ef4444';
    case 'invoiced': return '#8b5cf6';
    case 'draft': 
    default: return '#6b7280';
  }
};

const getStatusTextQuote = (status: string): string => {
  switch (status) {
    case 'accepted': return 'APPROVED';
    case 'sent': return 'SENT';
    case 'declined': return 'REJECTED';
    case 'invoiced': return 'INVOICED';
    case 'draft':
    default: return 'DRAFT';
  }
};