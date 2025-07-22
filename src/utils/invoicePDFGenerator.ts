import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Invoice } from '@/hooks/useInvoiceById';
import { CompanySettings } from '@/hooks/useCompanySettings';

export const generateInvoicePDF = async (
  invoiceRef: React.RefObject<HTMLDivElement>,
  invoice: Invoice,
  companySettings: CompanySettings
) => {
  if (!invoiceRef.current) {
    console.error('Invoice reference not found');
    return;
  }

  try {
    // Configure html2canvas options for better quality and CORS support
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Ensure images are loaded with CORS support
        const images = clonedDoc.querySelectorAll('img');
        images.forEach((img) => {
          img.crossOrigin = 'anonymous';
        });
      }
    });

    // Create PDF document
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit page
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    // Add the canvas as an image to the PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add watermark if status is PAID or DRAFT
    if (invoice.status === 'paid' || invoice.status === 'draft') {
      // Set watermark properties
      pdf.setTextColor(0, 0, 0, 0.1); // Very light gray
      pdf.setFontSize(72);
      pdf.setFont('helvetica', 'bold');
      
      // Calculate center position for watermark
      const watermarkText = invoice.status.toUpperCase();
      const textWidth = pdf.getStringUnitWidth(watermarkText) * pdf.getFontSize() / pdf.internal.scaleFactor;
      const x = (pageWidth - textWidth) / 2;
      const y = pageHeight / 2;
      
      // Rotate and add watermark text
      pdf.saveGraphicsState();
      pdf.setGState(pdf.GState({ opacity: 0.1 }));
      pdf.text(watermarkText, x, y, { 
        angle: 45,
        align: 'center'
      });
      pdf.restoreGraphicsState();
    }

    // Save the PDF with invoice number in filename
    pdf.save(`Invoice-${invoice.invoice_number || invoice.id}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};