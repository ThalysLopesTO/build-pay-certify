import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, QuoteLineItem } from '@/hooks/quotes';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { fetchLogoAsBase64 } from '@/utils/logoUtils';

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generateQuotePDF = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
) => {
  const pdf = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 15;
  
  let currentY = margin;
  
  // 1. Add header with logo and dark quote info box
  currentY = await addHeaderSection(pdf, quote, companySettings, logoUrl, currentY, pageWidth, margin);
  
  // 2. Add recipient section
  currentY = addRecipientSection(pdf, quote, currentY, margin);
  
  // 3. Add project details section
  currentY = addProjectDetailsSection(pdf, quote, currentY, margin);
  
  // 4. Add line items table (handles pagination automatically)
  currentY = addLineItemsTable(pdf, lineItems, currentY, margin, pageWidth);
  
  // 5. Add totals section (right-aligned)
  currentY = addTotalsSection(pdf, quote, currentY, pageWidth, margin);
  
  // 6. Add notes if present
  if (quote.notes) {
    currentY = addNotesSection(pdf, quote.notes, currentY, pageWidth, margin, pageHeight);
  }
  
  // 7. Add footer to all pages
  addFooterToAllPages(pdf, pageWidth, pageHeight);
  
  // 8. Save PDF
  const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, '')}.pdf`;
  pdf.save(filename);
};

// Helper: Add header with company info and dark quote box
const addHeaderSection = async (
  pdf: jsPDF,
  quote: Quote,
  settings: CompanySettings | null | undefined,
  logoUrl: string | null | undefined,
  startY: number,
  pageWidth: number,
  margin: number
): Promise<number> => {
  // Draw dark box on right side first
  pdf.setFillColor(60, 60, 60);
  pdf.roundedRect(120, margin, 75, 50, 2, 2, 'F');
  
  // Add logo on left
  if (logoUrl) {
    try {
      const logoBase64 = await fetchLogoAsBase64(logoUrl);
      pdf.addImage(logoBase64, 'PNG', margin, margin, 40, 20);
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  }
  
  // Company info on left
  let y = margin + 27;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(settings?.company_name || 'Company Name', margin, y);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  y += 7;
  if (settings?.company_address) {
    const addressLines = pdf.splitTextToSize(settings.company_address, 100);
    pdf.text(addressLines, margin, y);
    y += addressLines.length * 5;
  }
  if (settings?.company_phone) {
    pdf.text(`Phone: ${settings.company_phone}`, margin, y);
    y += 5;
  }
  if (settings?.company_email) {
    pdf.text(`Email: ${settings.company_email}`, margin, y);
  }
  
  // Quote info in dark box (white text)
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Quote #${quote.quote_number}`, 157.5, margin + 12, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const sentDate = quote.sent_date || quote.quote_date;
  const quoteDate = new Date(sentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  pdf.text(`Sent on ${quoteDate}`, 157.5, margin + 20, { align: 'center' });
  
  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(125, margin + 25, 190, margin + 25);
  
  // Total amount
  pdf.setFontSize(12);
  pdf.text('Total', 157.5, margin + 32, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(quote.total_amount);
  pdf.text(formattedTotal, 157.5, margin + 43, { align: 'center' });
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  return margin + 70; // Return Y position after header
};

// Helper: Add recipient section
const addRecipientSection = (
  pdf: jsPDF,
  quote: Quote,
  startY: number,
  margin: number
): number => {
  let y = startY;
  
  // Section header
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('RECIPIENT:', margin, y);
  y += 8;
  
  // Client details
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(quote.client_name, margin, y);
  y += 6;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  if (quote.client_company) {
    pdf.text(quote.client_company, margin, y);
    y += 5;
  }
  if (quote.client_address) {
    const addressLines = pdf.splitTextToSize(quote.client_address, 100);
    pdf.text(addressLines, margin, y);
    y += addressLines.length * 5;
  }
  pdf.text(quote.client_email, margin, y);
  y += 5;
  if (quote.client_phone) {
    pdf.text(`Phone: ${quote.client_phone}`, margin, y);
    y += 5;
  }
  
  return y + 10; // Add spacing after section
};

// Helper: Add project details section  
const addProjectDetailsSection = (
  pdf: jsPDF,
  quote: Quote,
  startY: number,
  margin: number
): number => {
  let y = startY;
  
  // Section header
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('PROJECT DETAILS:', margin, y);
  y += 8;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  // Project name
  pdf.text(`Project: ${quote.project_name}`, margin, y);
  y += 6;
  
  // Quote date
  const quoteDate = new Date(quote.quote_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.text(`Quote Date: ${quoteDate}`, margin, y);
  y += 6;
  
  // Valid until
  if (quote.expiry_date) {
    const expiryDate = new Date(quote.expiry_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Valid Until: ${expiryDate}`, margin, y);
    y += 6;
  }
  
  // Status
  pdf.text(`Status: ${quote.status.toUpperCase()}`, margin, y);
  y += 6;
  
  return y + 10; // Add spacing after section
};

// Helper: Add line items table using autoTable
const addLineItemsTable = (
  pdf: ExtendedJsPDF,
  lineItems: QuoteLineItem[],
  startY: number,
  margin: number,
  pageWidth: number
): number => {
  // Prepare table data
  const tableData = lineItems.map(item => {
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(item.amount);
    
    return [
      item.description,
      item.vendor || '-',
      formattedTotal
    ];
  });
  
  // Generate table
  autoTable(pdf, {
    startY: startY,
    head: [['Product/Service', 'Vendor', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 60, halign: 'left' },
      1: { cellWidth: 85, halign: 'left' },
      2: { cellWidth: 35, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: margin, right: margin }
  });
  
  return pdf.lastAutoTable.finalY + 10;
};

// Helper: Add totals section (right-aligned)
const addTotalsSection = (
  pdf: jsPDF,
  quote: Quote,
  startY: number,
  pageWidth: number,
  margin: number
): number => {
  const rightX = pageWidth - margin;
  const labelX = rightX - 55;
  const valueX = rightX;
  let y = startY;
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Subtotal
  pdf.text('Subtotal:', labelX, y, { align: 'right' });
  pdf.text(formatCurrency(quote.subtotal), valueX, y, { align: 'right' });
  y += 7;
  
  // Discount (if any)
  if (quote.discount > 0) {
    pdf.text('Discount:', labelX, y, { align: 'right' });
    pdf.text(`-${formatCurrency(quote.discount)}`, valueX, y, { align: 'right' });
    y += 7;
  }
  
  // Tax
  const taxAmount = (quote.subtotal - (quote.discount || 0)) * (quote.tax / 100);
  pdf.text(`Tax (${quote.tax}%):`, labelX, y, { align: 'right' });
  pdf.text(formatCurrency(taxAmount), valueX, y, { align: 'right' });
  y += 10;
  
  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(labelX - 5, y - 3, valueX, y - 3);
  
  // Total (bold and larger)
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL:', labelX, y, { align: 'right' });
  pdf.text(formatCurrency(quote.total_amount), valueX, y, { align: 'right' });
  
  return y + 15;
};

// Helper: Add notes section
const addNotesSection = (
  pdf: jsPDF,
  notes: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number
): number => {
  // Check if we need a new page
  if (startY + 30 > pageHeight - margin) {
    pdf.addPage();
    startY = margin;
  }
  
  let y = startY;
  
  // Section header
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('NOTES:', margin, y);
  y += 8;
  
  // Notes content
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const maxWidth = pageWidth - 2 * margin;
  const splitNotes = pdf.splitTextToSize(notes, maxWidth - 6);
  
  // Draw border around notes
  const notesHeight = splitNotes.length * 5 + 6;
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, y - 3, maxWidth, notesHeight);
  
  pdf.text(splitNotes, margin + 3, y + 2);
  
  return y + notesHeight + 10;
};

// Helper: Add footer to all pages
const addFooterToAllPages = (
  pdf: ExtendedJsPDF,
  pageWidth: number,
  pageHeight: number
) => {
  const pageCount = pdf.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    
    // Page number
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Thank you message
    pdf.text(
      'Thank you for your business!',
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    );
  }
  
  pdf.setTextColor(0, 0, 0);
};

// ===== BLOB GENERATION FOR EMAIL ATTACHMENTS =====

export const generateQuotePDFBlob = async (
  quote: Quote,
  lineItems: QuoteLineItem[],
  companySettings?: CompanySettings | null,
  logoUrl?: string | null
): Promise<{ blob: Blob; filename: string }> => {
  const pdf = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  
  let currentY = margin;
  
  // Generate PDF content (same as generateQuotePDF)
  currentY = await addHeaderSection(pdf, quote, companySettings, logoUrl, currentY, pageWidth, margin);
  currentY = addRecipientSection(pdf, quote, currentY, margin);
  currentY = addProjectDetailsSection(pdf, quote, currentY, margin);
  currentY = addLineItemsTable(pdf, lineItems, currentY, margin, pageWidth);
  currentY = addTotalsSection(pdf, quote, currentY, pageWidth, margin);
  
  if (quote.notes) {
    currentY = addNotesSection(pdf, quote.notes, currentY, pageWidth, margin, pageHeight);
  }
  
  addFooterToAllPages(pdf, pageWidth, pageHeight);
  
  // Return as blob instead of saving
  const blob = pdf.output('blob');
  const filename = `Quote-${quote.quote_number}-${quote.client_name.replace(/\s+/g, '')}.pdf`;
  
  return { blob, filename };
};

// Helper function to convert blob to base64 for email attachments
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
