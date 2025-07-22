import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Quote, QuoteLineItem } from '@/hooks/quotes';
import { CompanySettings } from '@/hooks/useCompanySettings';

export const generateQuotePDF = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
) => {
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
    
    // Generate HTML content
    tempDiv.innerHTML = await generateQuoteHTML(quote, lineItems, companySettings, logoUrl);
    
    document.body.appendChild(tempDiv);

    // Wait for images to load
    const images = tempDiv.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(void 0);
          } else {
            img.onload = () => resolve(void 0);
            img.onerror = () => resolve(void 0);
          }
        });
      })
    );

    // Generate canvas from HTML
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight,
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate scaling to fit content
    const scale = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const scaledWidth = canvasWidth * scale;
    const scaledHeight = canvasHeight * scale;
    
    // Center the content
    const x = (pdfWidth - scaledWidth) / 2;
    const y = 0;

    // Add the canvas image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

    // Add watermark if needed
    if (quote.status === 'draft' || quote.status === 'accepted') {
      pdf.setTextColor(0, 0, 0, 0.1);
      pdf.setFontSize(60);
      pdf.text(
        quote.status.toUpperCase(),
        pdfWidth / 2,
        pdfHeight / 2,
        { align: 'center', angle: 45 }
      );
    }

    // Save the PDF
    const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, '')}.pdf`;
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating quote PDF:', error);
    throw error;
  }
};

const generateQuoteHTML = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<string> => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

  const subtotal = quote.subtotal || 0;
  const discount = quote.discount || 0;
  const tax = quote.tax || 0;
  const total = quote.total_amount || 0;
  
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;

  return `
    <div style="max-width: 794px; margin: 0 auto; background: white; color: #1f2937;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #e5e7eb;">
        <div style="flex: 1;">
          ${logoUrl ? `
            <img 
              src="${logoUrl}" 
              alt="Company Logo" 
              style="max-height: 80px; max-width: 200px; margin-bottom: 20px;" 
              crossorigin="anonymous"
            />
          ` : ''}
          <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            ${companySettings?.company_name ? `<strong>${companySettings.company_name}</strong><br>` : ''}
            ${companySettings?.company_address ? `${companySettings.company_address}<br>` : ''}
            ${companySettings?.company_phone ? `Phone: ${companySettings.company_phone}<br>` : ''}
            ${companySettings?.company_email ? `Email: ${companySettings.company_email}<br>` : ''}
            ${companySettings?.hst_number ? `HST: ${companySettings.hst_number}` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h1 style="font-size: 36px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">QUOTE</h1>
          <div style="font-size: 18px; font-weight: 600; color: #374151;">#${quote.quote_number}</div>
        </div>
      </div>

      <!-- Quote Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1; margin-right: 40px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Quote To</h3>
          <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong style="color: #1f2937;">${quote.client_name}</strong><br>
            ${quote.client_company ? `${quote.client_company}<br>` : ''}
            ${quote.client_email ? `${quote.client_email}<br>` : ''}
            ${quote.client_phone ? `${quote.client_phone}<br>` : ''}
            ${quote.client_address ? `${quote.client_address}` : ''}
          </div>
        </div>
        <div style="flex: 1;">
          <h3 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Project Details</h3>
          <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong style="color: #1f2937;">Project:</strong> ${quote.project_name}<br>
            <strong style="color: #1f2937;">Quote Date:</strong> ${formatDate(quote.quote_date)}<br>
            ${quote.expiry_date ? `<strong style="color: #1f2937;">Valid Until:</strong> ${formatDate(quote.expiry_date)}<br>` : ''}
            <strong style="color: #1f2937;">Status:</strong> <span style="background: ${getStatusColor(quote.status)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${getStatusText(quote.status)}</span>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div style="margin-bottom: 40px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 20px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Quote Items</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Description</th>
              ${lineItems.some(item => item.vendor) ? '<th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Vendor</th>' : ''}
              <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Unit Price</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map((item, index) => `
              <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : ''} border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; color: #1f2937;">${item.description}</td>
                ${lineItems.some(li => li.vendor) ? `<td style="padding: 12px 8px; color: #6b7280;">${item.vendor || '—'}</td>` : ''}
                <td style="padding: 12px 8px; text-align: center; color: #6b7280;">${item.quantity}</td>
                <td style="padding: 12px 8px; text-align: right; color: #6b7280;">${formatCurrency(item.unit_price)}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #1f2937;">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 300px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Subtotal:</td>
              <td style="padding: 8px 0; text-align: right; color: #1f2937; font-weight: 600;">${formatCurrency(subtotal)}</td>
            </tr>
            ${discount > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Discount (${discount}%):</td>
                <td style="padding: 8px 0; text-align: right; color: #dc2626;">-${formatCurrency(discountAmount)}</td>
              </tr>
            ` : ''}
            ${tax > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Tax (${tax}%):</td>
                <td style="padding: 8px 0; text-align: right; color: #1f2937;">${formatCurrency(taxAmount)}</td>
              </tr>
            ` : ''}
            <tr style="border-top: 2px solid #e5e7eb;">
              <td style="padding: 12px 0; font-size: 18px; font-weight: 700; color: #1f2937;">Total:</td>
              <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: 700; color: #1f2937;">${formatCurrency(total)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Notes -->
      ${quote.notes ? `
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Notes</h3>
          <div style="color: #6b7280; font-size: 14px; line-height: 1.6; background: #f9fafb; padding: 20px; border-radius: 8px;">
            ${quote.notes.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p style="margin: 5px 0;">Thank you for your business!</p>
        ${companySettings?.company_name ? `<p style="margin: 5px 0;">© ${new Date().getFullYear()} ${companySettings.company_name}. All rights reserved.</p>` : ''}
      </div>
    </div>
  `;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'accepted': return '#10b981';
    case 'sent': return '#3b82f6';
    case 'declined': return '#ef4444';
    case 'invoiced': return '#8b5cf6';
    case 'draft': 
    default: return '#6b7280';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'accepted': return 'APPROVED';
    case 'sent': return 'SENT';
    case 'declined': return 'REJECTED';
    case 'invoiced': return 'INVOICED';
    case 'draft':
    default: return 'DRAFT';
  }
};