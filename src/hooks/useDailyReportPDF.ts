import { jsPDF } from 'jspdf';
import { DailyReport } from '@/hooks/useDailyReports';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const useDailyReportPDF = () => {
  const generateDailyReportPDF = async (data: {
    report: DailyReport;
    companySettings?: CompanySettings | null;
    logoUrl?: string | null;
  }) => {
    const { report, companySettings, logoUrl } = data;
    const doc = new jsPDF() as ExtendedJsPDF;
    
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Add company logo as watermark if available
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = logoUrl;
        });
        
        // Add logo as watermark (light opacity, centered)
        const logoSize = 60;
        const logoX = (pageWidth - logoSize) / 2;
        const logoY = 50;
        
        doc.saveGraphicsState();
        doc.setGState({ opacity: 0.1 });
        doc.addImage(img, 'PNG', logoX, logoY, logoSize, logoSize);
        doc.restoreGraphicsState();
      } catch (error) {
        console.warn('Failed to load company logo for PDF:', error);
      }
    }

    // Header - Company Information
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const companyName = companySettings?.company_name || 'Company Name';
    doc.text(companyName, margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (companySettings?.company_address) {
      doc.text(companySettings.company_address, margin, yPos);
      yPos += 6;
    }
    if (companySettings?.company_phone) {
      doc.text(`Phone: ${companySettings.company_phone}`, margin, yPos);
      yPos += 6;
    }
    if (companySettings?.company_email) {
      doc.text(`Email: ${companySettings.company_email}`, margin, yPos);
      yPos += 10;
    }

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DAILY REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Report Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    const reportInfo = [
      ['Jobsite:', report.jobsites?.name || 'Unknown Jobsite'],
      ['Address:', report.jobsites?.address || 'N/A'],
      ['Report Date:', format(new Date(report.report_date), 'PPPP')],
      ['Submitted By:', report.user_profiles 
        ? `${report.user_profiles.first_name} ${report.user_profiles.last_name}`
        : 'Unknown User'],
      ['Submitted Time:', format(new Date(report.created_at), 'h:mm a')]
    ];

    reportInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 40, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Summary Section
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    const summaryText = report.summary || 'No summary provided';
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(splitSummary, margin, yPos);
    yPos += splitSummary.length * 5 + 10;

    // Photos Section
    if (report.photos && report.photos.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Photos (${report.photos.length} attached)`, margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Note: Photos are included in the digital version of this report.', margin, yPos);
      yPos += 10;

      // Try to add actual photos to PDF if possible
      for (let i = 0; i < Math.min(report.photos.length, 3); i++) {
        const photoUrl = report.photos[i];
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = photoUrl;
          });

          // Check if we need a new page
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }

          const imgWidth = 60;
          const imgHeight = 45;
          doc.addImage(img, 'JPEG', margin, yPos, imgWidth, imgHeight);
          
          if (i < 2 && (i + 1) < report.photos.length) {
            doc.addImage(img, 'JPEG', margin + 70, yPos, imgWidth, imgHeight);
            i++; // Skip next iteration since we added two images
          }
          
          yPos += imgHeight + 10;
        } catch (error) {
          console.warn(`Failed to load photo ${i + 1} for PDF:`, error);
          doc.text(`Photo ${i + 1}: [Unable to load image]`, margin, yPos);
          yPos += 6;
        }
      }

      if (report.photos.length > 3) {
        doc.text(`... and ${report.photos.length - 3} more photos`, margin, yPos);
        yPos += 10;
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated on ${format(new Date(), 'PPP')} - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const filename = `Daily_Report_${report.jobsites?.name || 'Unknown'}_${format(new Date(report.report_date), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
  };

  return { generateDailyReportPDF };
};