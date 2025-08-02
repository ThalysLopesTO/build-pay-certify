import { jsPDF } from 'jspdf';
import { DailyReport } from '@/hooks/useDailyReports';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable: { finalY: number };
}

export const useDailyReportPDF = () => {
  const generateDailyReportPDF = async (data: {
    report: DailyReport;
    companySettings?: CompanySettings | null;
    logoUrl?: string | null;
  }) => {
    const { report, companySettings, logoUrl } = data;
    const doc = new jsPDF() as ExtendedJsPDF;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 25;

    /** ------------------------------------------------------
     ✅ 1. Add Light Watermark Logo
    ------------------------------------------------------ **/
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = logoUrl;
        });

        doc.saveGraphicsState();
        doc.setGState({ opacity: 0.08 });
        doc.addImage(img, 'PNG', pageWidth / 2 - 40, pageHeight / 2 - 40, 80, 80);
        doc.restoreGraphicsState();
      } catch (error) {
        console.warn('⚠️ Failed to load watermark logo:', error);
      }
    }

    /** ------------------------------------------------------
     ✅ 2. Header with Logo + Company Info
    ------------------------------------------------------ **/
    if (logoUrl) {
      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
          logo.src = logoUrl;
        });
        doc.addImage(logo, 'PNG', pageWidth - 50, 10, 30, 30); // Logo at top right
      } catch (error) {
        console.warn('⚠️ Failed to load header logo:', error);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(companySettings?.company_name || 'Company Name', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (companySettings?.company_address) {
      doc.text(companySettings.company_address, margin, yPos);
      yPos += 5;
    }
    if (companySettings?.company_phone) {
      doc.text(`Phone: ${companySettings.company_phone}`, margin, yPos);
      yPos += 5;
    }
    if (companySettings?.company_email) {
      doc.text(`Email: ${companySettings.company_email}`, margin, yPos);
      yPos += 10;
    }

    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    /** ------------------------------------------------------
     ✅ 3. Title Section
    ------------------------------------------------------ **/
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('DAILY REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    /** ------------------------------------------------------
     ✅ 4. Report Details Section
    ------------------------------------------------------ **/
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Report Information', margin, yPos);
    yPos += 8;

    const reportInfo = [
      ['Jobsite:', report.jobsites?.name || 'Unknown Jobsite'],
      ['Address:', report.jobsites?.address || 'N/A'],
      ['Report Date:', format(new Date(report.report_date), 'PPPP')],
      ['Submitted By:', report.user_profiles 
        ? `${report.user_profiles.first_name} ${report.user_profiles.last_name}`
        : 'Unknown User'],
      ['Submitted Time:', format(new Date(report.created_at), 'h:mm a')],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    reportInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 40, yPos);
      yPos += 6;
    });

    yPos += 10;

    /** ------------------------------------------------------
     ✅ 5. Summary Section
    ------------------------------------------------------ **/
    doc.setFont('helvetica', 'bold');
    doc.text('Summary / Notes', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    const summaryText = report.summary || 'No summary provided.';
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(splitSummary, margin, yPos);
    yPos += splitSummary.length * 6 + 10;

    /** ------------------------------------------------------
     ✅ 6. Photos Section (if exists)
    ------------------------------------------------------ **/
    if (report.photos && report.photos.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Photos (${report.photos.length} attached)`, margin, yPos);
      yPos += 8;

      let imgX = margin;
      let imgY = yPos;
      const imgWidth = 55;
      const imgHeight = 40;
      const gap = 10;

      for (let i = 0; i < report.photos.length; i++) {
        if (imgX + imgWidth > pageWidth - margin) {
          imgX = margin;
          imgY += imgHeight + gap;
        }

        if (imgY > pageHeight - 50) {
          doc.addPage();
          imgY = 30;
        }

        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = report.photos[i];
          });

          doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);
        } catch (error) {
          doc.setFontSize(10);
          doc.text(`[Photo ${i + 1} failed to load]`, imgX, imgY + 10);
        }

        imgX += imgWidth + gap;
      }

      yPos = imgY + imgHeight + 10;
    }

    /** ------------------------------------------------------
     ✅ 7. Footer Section
    ------------------------------------------------------ **/
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(220);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated on ${format(new Date(), 'PPP')} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    /** ------------------------------------------------------
     ✅ 8. Save PDF
    ------------------------------------------------------ **/
    const filename = `Daily_Report_${report.jobsites?.name || 'Unknown'}_${format(new Date(report.report_date), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
  };

  return { generateDailyReportPDF };
};
