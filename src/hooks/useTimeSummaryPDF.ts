import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fetchLogoAsBase64 } from '@/utils/logoUtils';
import { useToast } from './use-toast';
import { JobsiteSummaryWithRules } from './useTimeSummaryDataWithRules';

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface TimeSummaryPDFParams {
  data: JobsiteSummaryWithRules[];
  companyName: string;
  companyLogo?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  periodStart: Date;
  periodEnd: Date;
  timezone: string;
  filters?: {
    employeeNames?: string[];
    jobsiteNames?: string[];
    status?: string;
  };
}

export const useTimeSummaryPDF = () => {
  const { toast } = useToast();

  const generateTimeSummaryPDF = async ({
    data,
    companyName,
    companyLogo,
    companyAddress,
    companyPhone,
    companyEmail,
    periodStart,
    periodEnd,
    timezone,
    filters,
  }: TimeSummaryPDFParams) => {
    try {
      const doc = new jsPDF() as ExtendedJsPDF;
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const leftMargin = 14;
      const rightMargin = 14;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      // ========== Header Section ==========
      const headerHeight = 45;
      
      // Add company logo on left
      if (companyLogo) {
        try {
          const logoBase64 = await fetchLogoAsBase64(companyLogo);
          if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', leftMargin, yPos, 40, 20);
          }
        } catch (error) {
          console.warn('Failed to load logo for PDF:', error);
        }
      }

      // Center - Report title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('PAYROLL SUMMARY REPORT', pageWidth / 2, yPos + 8, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Period: ${format(periodStart, 'MMM dd, yyyy')} → ${format(periodEnd, 'MMM dd, yyyy')}`,
        pageWidth / 2,
        yPos + 15,
        { align: 'center' }
      );

      // Right - Company information block
      const rightX = pageWidth - rightMargin;
      let rightY = yPos;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(companyName, rightX, rightY, { align: 'right' });
      rightY += 5;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      if (companyAddress) {
        doc.text(companyAddress, rightX, rightY, { align: 'right' });
        rightY += 4;
      }
      if (companyPhone) {
        doc.text(companyPhone, rightX, rightY, { align: 'right' });
        rightY += 4;
      }
      if (companyEmail) {
        doc.text(companyEmail, rightX, rightY, { align: 'right' });
      }

      yPos += headerHeight;
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);
      yPos += 10;

      // Metadata and filter indicators
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      
      doc.text(
        `Generated: ${format(new Date(), 'MMM dd, yyyy \'at\' h:mm a')} • Times shown in ${timezone}`,
        leftMargin,
        yPos
      );
      yPos += 6;

      // Active filters
      if (filters) {
        const filterTexts: string[] = [];
        
        if (filters.employeeNames && filters.employeeNames.length > 0) {
          const empText = filters.employeeNames.length === 1 
            ? filters.employeeNames[0] 
            : `${filters.employeeNames.length} employees selected`;
          filterTexts.push(`Employees: ${empText}`);
        }
        
        if (filters.jobsiteNames && filters.jobsiteNames.length > 0) {
          const jobText = filters.jobsiteNames.length === 1 
            ? filters.jobsiteNames[0] 
            : `${filters.jobsiteNames.length} projects selected`;
          filterTexts.push(`Projects: ${jobText}`);
        }
        
        if (filters.status && filters.status !== 'all') {
          filterTexts.push(`Status: ${filters.status}`);
        }
        
        if (filterTexts.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Filters: ${filterTexts.join(' • ')}`, leftMargin, yPos);
          yPos += 6;
        }
      }
      
      yPos += 8;

      // ========== Summary Statistics ==========
      const totalJobsites = data.length;
      const totalEmployees = data.reduce((sum, jobsite) => sum + jobsite.employees.length, 0);
      const totalPaidHours = data.reduce(
        (sum, jobsite) =>
          sum + jobsite.employees.reduce((empSum, emp) => empSum + (emp.total_paid_hours || 0), 0),
        0
      );
      const totalIssues = data.reduce(
        (sum, jobsite) =>
          sum + jobsite.employees.reduce((empSum, emp) => empSum + (emp.issue_count || 0), 0),
        0
      );

      // Summary boxes
      doc.setFillColor(249, 250, 251);
      const boxWidth = contentWidth / 4 - 3;
      const boxHeight = 18;
      const boxY = yPos;

      for (let i = 0; i < 4; i++) {
        const boxX = leftMargin + i * (boxWidth + 4);
        doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);

      doc.text(totalJobsites.toString(), leftMargin + boxWidth / 2, boxY + 8, { align: 'center' });
      doc.text(totalEmployees.toString(), leftMargin + boxWidth + 4 + boxWidth / 2, boxY + 8, {
        align: 'center',
      });
      doc.text(
        totalPaidHours.toFixed(2),
        leftMargin + 2 * (boxWidth + 4) + boxWidth / 2,
        boxY + 8,
        { align: 'center' }
      );
      doc.text(
        totalIssues.toString(),
        leftMargin + 3 * (boxWidth + 4) + boxWidth / 2,
        boxY + 8,
        { align: 'center' }
      );

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);

      doc.text('Locations', leftMargin + boxWidth / 2, boxY + 14, { align: 'center' });
      doc.text('Employees', leftMargin + boxWidth + 4 + boxWidth / 2, boxY + 14, {
        align: 'center',
      });
      doc.text('Paid Hours', leftMargin + 2 * (boxWidth + 4) + boxWidth / 2, boxY + 14, {
        align: 'center',
      });
      doc.text('Issues', leftMargin + 3 * (boxWidth + 4) + boxWidth / 2, boxY + 14, {
        align: 'center',
      });

      yPos += boxHeight + 15;

      // ========== Jobsite Details ==========
      doc.setTextColor(0, 0, 0);

      for (const jobsite of data) {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Jobsite header
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(`📍 ${jobsite.jobsite_name}`, leftMargin, yPos);
        yPos += 8;

        // Employee table
        const tableData = jobsite.employees.map((emp) => [
          emp.employee_name,
          emp.employee_position || emp.employee_trade || emp.employee_role || '-',
          (emp.days_worked || 0).toString(),
          (emp.total_raw_hours || 0).toFixed(2),
          (emp.total_paid_hours || 0).toFixed(2),
          (emp.total_punches || 0).toString(),
          (emp.issue_count || 0).toString(),
        ]);

        // Calculate subtotals for this jobsite
        const jobsiteTotals = jobsite.employees.reduce(
          (acc, emp) => ({
            daysWorked: acc.daysWorked + (emp.days_worked || 0),
            rawHours: acc.rawHours + (emp.total_raw_hours || 0),
            paidHours: acc.paidHours + (emp.total_paid_hours || 0),
            punchCount: acc.punchCount + (emp.total_punches || 0),
            issueCount: acc.issueCount + (emp.issue_count || 0),
          }),
          { daysWorked: 0, rawHours: 0, paidHours: 0, punchCount: 0, issueCount: 0 }
        );

        // Add subtotal row
        tableData.push([
          'SUBTOTAL',
          '',
          jobsiteTotals.daysWorked.toString(),
          jobsiteTotals.rawHours.toFixed(2),
          jobsiteTotals.paidHours.toFixed(2),
          jobsiteTotals.punchCount.toString(),
          jobsiteTotals.issueCount.toString(),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Employee', 'Role', 'Days', 'Raw Hrs', 'Paid Hrs', 'Punches', 'Issues']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 30 },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 20, halign: 'right' },
            4: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 18, halign: 'center' },
            6: { cellWidth: 18, halign: 'center' },
          },
          didParseCell: (data: any) => {
            // Style the subtotal row
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [229, 231, 235];
              data.cell.styles.textColor = [0, 0, 0];
            }
          },
          margin: { left: leftMargin, right: rightMargin },
        });

        yPos = (doc as ExtendedJsPDF).lastAutoTable?.finalY || yPos + 10;
        yPos += 10;
      }

      // ========== Grand Totals Section ==========
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('GRAND TOTALS', leftMargin, yPos);
      yPos += 3;
      doc.setDrawColor(37, 99, 235);
      doc.line(leftMargin, yPos, leftMargin + 60, yPos);
      yPos += 10;

      const grandTotals = data.reduce(
        (acc, jobsite) => {
          const jobsiteTotals = jobsite.employees.reduce(
            (jAcc, emp) => ({
              daysWorked: jAcc.daysWorked + (emp.days_worked || 0),
              rawHours: jAcc.rawHours + (emp.total_raw_hours || 0),
              paidHours: jAcc.paidHours + (emp.total_paid_hours || 0),
              punchCount: jAcc.punchCount + (emp.total_punches || 0),
              issueCount: jAcc.issueCount + (emp.issue_count || 0),
            }),
            { daysWorked: 0, rawHours: 0, paidHours: 0, punchCount: 0, issueCount: 0 }
          );
          return {
            daysWorked: acc.daysWorked + jobsiteTotals.daysWorked,
            rawHours: acc.rawHours + jobsiteTotals.rawHours,
            paidHours: acc.paidHours + jobsiteTotals.paidHours,
            punchCount: acc.punchCount + jobsiteTotals.punchCount,
            issueCount: acc.issueCount + jobsiteTotals.issueCount,
          };
        },
        { daysWorked: 0, rawHours: 0, paidHours: 0, punchCount: 0, issueCount: 0 }
      );

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      const totalsData = [
        ['Total Employees:', totalEmployees.toString()],
        ['Total Locations:', totalJobsites.toString()],
        ['Total Days Worked:', grandTotals.daysWorked.toString()],
        ['Total Raw Hours:', grandTotals.rawHours.toFixed(2)],
        ['Total Paid Hours:', grandTotals.paidHours.toFixed(2)],
        ['Total Punches:', grandTotals.punchCount.toString()],
        ['Total Issues:', grandTotals.issueCount.toString()],
      ];

      totalsData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, leftMargin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, leftMargin + 50, yPos);
        yPos += 7;
      });

      // ========== Footer ==========
      const addFooter = (pageNum: number, totalPages: number) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerY = pageHeight - 10;
        
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        
        // Left: Company name
        doc.text(companyName, leftMargin, footerY);
        
        // Center: Generated date and timezone
        doc.text(
          `Generated ${format(new Date(), 'MMM dd, yyyy')} • Times shown in ${timezone}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );
        
        // Right: Page numbers
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - rightMargin, footerY, {
          align: 'right',
        });
      };

      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      // ========== Save PDF ==========
      const fileName = `stackbuild-payroll-summary-${format(periodStart, 'yyyy-MM-dd')}_to_${format(
        periodEnd,
        'yyyy-MM-dd'
      )}.pdf`;
      doc.save(fileName);

      toast({
        title: 'PDF Generated',
        description: 'Payroll summary PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return { generateTimeSummaryPDF };
};
