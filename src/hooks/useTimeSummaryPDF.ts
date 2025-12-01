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

// Design constants
const COLORS = {
  PRIMARY_ACCENT: [255, 138, 61] as [number, number, number], // StackBuild orange
  DARK_TEXT: [51, 51, 51] as [number, number, number],
  LIGHT_GREY: [245, 245, 245] as [number, number, number],
  MEDIUM_GREY: [200, 200, 200] as [number, number, number],
  SECTION_BG: [229, 231, 235] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number],
};

const FONTS = {
  TITLE: 18,
  SECTION_HEADING: 13,
  SUBSECTION: 11,
  BODY: 10,
  SMALL: 8,
};

const MARGINS = {
  TOP: 20,
  LEFT: 15,
  RIGHT: 15,
  BOTTOM: 20,
};

// Helper function: Draw professional header with logo and company info
const drawHeader = async (
  doc: ExtendedJsPDF,
  params: TimeSummaryPDFParams
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = MARGINS.TOP;
  const logoWidth = 50;
  const logoHeight = 25;

  // Add company logo on left
  if (params.companyLogo) {
    try {
      const logoBase64 = await fetchLogoAsBase64(params.companyLogo);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', MARGINS.LEFT, yPos, logoWidth, logoHeight);
      }
    } catch (error) {
      console.warn('Failed to load logo for PDF:', error);
    }
  }

  // Right side: Company information block
  const rightX = pageWidth - MARGINS.RIGHT;
  let rightY = yPos;

  doc.setFontSize(FONTS.SUBSECTION);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.DARK_TEXT);
  doc.text(params.companyName, rightX, rightY, { align: 'right' });
  rightY += 5;

  doc.setFontSize(FONTS.SMALL);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  if (params.companyAddress) {
    doc.text(params.companyAddress, rightX, rightY, { align: 'right' });
    rightY += 4;
  }

  const contactLine: string[] = [];
  if (params.companyPhone) contactLine.push(params.companyPhone);
  if (params.companyEmail) contactLine.push(params.companyEmail);
  if (contactLine.length > 0) {
    doc.text(contactLine.join(' | '), rightX, rightY, { align: 'right' });
  }

  // Center: Report title
  const centerY = yPos + logoHeight / 2;
  doc.setFontSize(FONTS.TITLE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.PRIMARY_ACCENT);
  doc.text('PAYROLL SUMMARY REPORT', pageWidth / 2, centerY - 3, { align: 'center' });

  doc.setFontSize(FONTS.BODY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(params.companyName, pageWidth / 2, centerY + 5, { align: 'center' });

  yPos += logoHeight + 8;

  // Horizontal rule
  doc.setDrawColor(...COLORS.MEDIUM_GREY);
  doc.setLineWidth(0.5);
  doc.line(MARGINS.LEFT, yPos, pageWidth - MARGINS.RIGHT, yPos);
  yPos += 8;

  // Metadata row - 2 columns
  doc.setFontSize(FONTS.SMALL);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');

  // Left column
  doc.text(
    `Period: ${format(params.periodStart, 'MMM dd, yyyy')} – ${format(params.periodEnd, 'MMM dd, yyyy')}`,
    MARGINS.LEFT,
    yPos
  );
  doc.text(`Timezone: ${params.timezone}`, MARGINS.LEFT, yPos + 4);

  // Right column
  doc.text(
    `Generated: ${format(new Date(), 'MMM dd, yyyy \'at\' h:mm a')}`,
    rightX,
    yPos,
    { align: 'right' }
  );

  yPos += 10;

  return yPos;
};

// Helper function: Draw filters summary block
const drawFiltersBlock = (
  doc: ExtendedJsPDF,
  filters: TimeSummaryPDFParams['filters'],
  yPos: number
): number => {
  if (!filters) return yPos;

  const filterLines: string[] = [];

  if (filters.employeeNames && filters.employeeNames.length > 0) {
    const empText =
      filters.employeeNames.length === 1
        ? filters.employeeNames[0]
        : filters.employeeNames.join(', ');
    filterLines.push(`Employees: ${empText}`);
  }

  if (filters.jobsiteNames && filters.jobsiteNames.length > 0) {
    const jobText =
      filters.jobsiteNames.length === 1
        ? filters.jobsiteNames[0]
        : filters.jobsiteNames.join(', ');
    filterLines.push(`Locations: ${jobText}`);
  }

  if (filters.status && filters.status !== 'all') {
    filterLines.push(`Status: ${filters.status}`);
  }

  if (filterLines.length === 0) return yPos;

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.LEFT - MARGINS.RIGHT;
  const blockHeight = 6 + filterLines.length * 4;

  // Draw rounded rectangle background
  doc.setFillColor(...COLORS.LIGHT_GREY);
  doc.roundedRect(MARGINS.LEFT, yPos, contentWidth, blockHeight, 2, 2, 'F');

  // Draw title
  doc.setFontSize(FONTS.SMALL);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.DARK_TEXT);
  doc.text('Filters:', MARGINS.LEFT + 3, yPos + 4);

  // Draw filter lines
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  filterLines.forEach((line, index) => {
    doc.text(line, MARGINS.LEFT + 3, yPos + 8 + index * 4);
  });

  return yPos + blockHeight + 10;
};

// Helper function: Draw summary statistics boxes
const drawSummaryStatistics = (
  doc: ExtendedJsPDF,
  data: JobsiteSummaryWithRules[],
  yPos: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.LEFT - MARGINS.RIGHT;

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

  const boxWidth = contentWidth / 4 - 3;
  const boxHeight = 20;

  const stats = [
    { label: 'Locations', value: totalJobsites.toString() },
    { label: 'Employees', value: totalEmployees.toString() },
    { label: 'Paid Hours', value: totalPaidHours.toFixed(2) },
    { label: 'Issues', value: totalIssues.toString() },
  ];

  stats.forEach((stat, i) => {
    const boxX = MARGINS.LEFT + i * (boxWidth + 4);

    // Draw box background
    doc.setFillColor(...COLORS.LIGHT_GREY);
    doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 3, 3, 'F');

    // Draw value
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.PRIMARY_ACCENT);
    doc.text(stat.value, boxX + boxWidth / 2, yPos + 9, { align: 'center' });

    // Draw label
    doc.setFontSize(FONTS.SMALL);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(stat.label, boxX + boxWidth / 2, yPos + 15, { align: 'center' });
  });

  return yPos + boxHeight + 15;
};

// Helper function: Draw jobsite section with table
const drawJobsiteSection = (
  doc: ExtendedJsPDF,
  jobsite: JobsiteSummaryWithRules,
  yPos: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Check if we need a new page for the section header + at least a few rows
  if (yPos > 240) {
    doc.addPage();
    yPos = MARGINS.TOP;
  }

  // Draw section header with grey background bar
  const headerHeight = 8;
  doc.setFillColor(...COLORS.SECTION_BG);
  doc.rect(MARGINS.LEFT, yPos - 2, pageWidth - MARGINS.LEFT - MARGINS.RIGHT, headerHeight, 'F');

  doc.setFontSize(FONTS.SECTION_HEADING);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.DARK_TEXT);
  doc.text(`Location: ${jobsite.jobsite_name}`, MARGINS.LEFT + 2, yPos + 4);

  yPos += headerHeight + 2;

  // Prepare table data
  const tableData = jobsite.employees.map((emp) => [
    emp.employee_name,
    emp.employee_position || emp.employee_trade || emp.employee_role || 'Employee',
    (emp.days_worked || 0).toString(),
    (emp.total_raw_hours || 0).toFixed(2),
    (emp.total_paid_hours || 0).toFixed(2),
    (emp.total_punches || 0).toString(),
    (emp.issue_count || 0).toString(),
  ]);

  // Calculate subtotals
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

  // Draw table
  autoTable(doc, {
    startY: yPos,
    head: [['Employee', 'Role', 'Days', 'Raw Hrs', 'Paid Hrs', 'Punches', 'Issues']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.LIGHT_GREY,
      textColor: COLORS.DARK_TEXT,
      fontSize: FONTS.BODY,
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: COLORS.MEDIUM_GREY,
    },
    bodyStyles: {
      fontSize: FONTS.BODY,
      textColor: COLORS.DARK_TEXT,
      lineWidth: 0.1,
      lineColor: COLORS.MEDIUM_GREY,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
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
        data.cell.styles.fillColor = COLORS.SECTION_BG;
        data.cell.styles.textColor = COLORS.DARK_TEXT;
      }
    },
    margin: { left: MARGINS.LEFT, right: MARGINS.RIGHT },
  });

  return (doc as ExtendedJsPDF).lastAutoTable?.finalY || yPos + 10;
};

// Helper function: Draw grand totals section
const drawGrandTotals = (
  doc: ExtendedJsPDF,
  data: JobsiteSummaryWithRules[],
  yPos: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage();
    yPos = MARGINS.TOP;
  }

  yPos += 5;

  // Calculate grand totals
  const totalJobsites = data.length;
  const totalEmployees = data.reduce((sum, jobsite) => sum + jobsite.employees.length, 0);

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

  // Draw section header with background
  const contentWidth = pageWidth - MARGINS.LEFT - MARGINS.RIGHT;
  const boxHeight = 60;

  doc.setFillColor(...COLORS.LIGHT_GREY);
  doc.roundedRect(MARGINS.LEFT, yPos, contentWidth, boxHeight, 3, 3, 'F');

  // Title
  doc.setFontSize(FONTS.SECTION_HEADING);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.PRIMARY_ACCENT);
  doc.text('GRAND TOTALS', MARGINS.LEFT + 5, yPos + 8);

  yPos += 15;

  // Totals data in 2 columns
  const totalsData = [
    ['Total Employees:', totalEmployees.toString()],
    ['Total Locations:', totalJobsites.toString()],
    ['Total Days Worked:', grandTotals.daysWorked.toString()],
    ['Total Raw Hours:', grandTotals.rawHours.toFixed(2)],
    ['Total Paid Hours:', grandTotals.paidHours.toFixed(2)],
    ['Total Punches:', grandTotals.punchCount.toString()],
    ['Total Issues:', grandTotals.issueCount.toString()],
  ];

  doc.setFontSize(FONTS.BODY);
  const leftColX = MARGINS.LEFT + 5;
  const rightColX = MARGINS.LEFT + contentWidth / 2 + 5;
  const labelOffset = 40;

  totalsData.forEach(([label, value], index) => {
    const isLeftColumn = index < 4;
    const colX = isLeftColumn ? leftColX : rightColX;
    const rowY = yPos + (index % 4) * 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.DARK_TEXT);
    doc.text(label, colX, rowY);

    doc.setFont('helvetica', 'normal');
    doc.text(value, colX + labelOffset, rowY);
  });

  return yPos + boxHeight + 5;
};

// Helper function: Add footer to all pages
const addFooterToAllPages = (
  doc: ExtendedJsPDF,
  companyName: string,
  timezone: string
): void => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - MARGINS.BOTTOM + 5;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFontSize(FONTS.SMALL);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');

    // Left: Company name
    doc.text(companyName, MARGINS.LEFT, footerY);

    // Center: Generated date and timezone
    doc.text(
      `Generated ${format(new Date(), 'MMM dd, yyyy')} • Times shown in ${timezone}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Right: Page numbers
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - MARGINS.RIGHT, footerY, {
      align: 'right',
    });
  }
};

// Main hook
export const useTimeSummaryPDF = () => {
  const { toast } = useToast();

  const generateTimeSummaryPDF = async (params: TimeSummaryPDFParams) => {
    try {
      const doc = new jsPDF() as ExtendedJsPDF;

      // Draw header with logo and company info
      let yPos = await drawHeader(doc, params);

      // Draw filters block
      yPos = drawFiltersBlock(doc, params.filters, yPos);

      // Draw summary statistics
      yPos = drawSummaryStatistics(doc, params.data, yPos);

      // Draw jobsite sections
      for (const jobsite of params.data) {
        yPos = drawJobsiteSection(doc, jobsite, yPos);
        yPos += 12; // Spacing between jobsites
      }

      // Draw grand totals
      yPos = drawGrandTotals(doc, params.data, yPos);

      // Add footer to all pages
      addFooterToAllPages(doc, params.companyName, params.timezone);

      // Save PDF
      const fileName = `payroll-summary-${format(params.periodStart, 'yyyy-MM-dd')}_to_${format(
        params.periodEnd,
        'yyyy-MM-dd'
      )}.pdf`;
      doc.save(fileName);

      toast({
        title: 'PDF Generated',
        description: 'Professional payroll summary PDF has been downloaded successfully.',
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
