import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ManualTimesheet } from '@/hooks/useManualTimesheets';
import { formatDateLong } from '@/utils/manualTimesheetDays';

const formatCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export interface PdfBranding {
  companyName?: string | null;
  logoUrl?: string | null;
}

export const generateManualTimesheetPDF = async (
  ts: ManualTimesheet,
  branding: PdfBranding
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // ========= Header
  if (branding.logoUrl) {
    const dataUrl = await loadImageAsDataUrl(branding.logoUrl);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, 'PNG', margin, y, 70, 70);
      } catch {
        // ignore
      }
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(branding.companyName ?? 'Company', margin + 85, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(110, 110, 110);
  doc.text('TIME SHEET', margin + 85, y + 45);
  doc.setTextColor(0, 0, 0);

  // Right-aligned meta
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, pageWidth - margin, y + 15, {
    align: 'right',
  });
  doc.text(`Created: ${new Date(ts.created_at).toLocaleDateString('en-US')}`, pageWidth - margin, y + 30, {
    align: 'right',
  });
  doc.setTextColor(0, 0, 0);

  y += 90;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // ========= Meta block
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(ts.employee_name, margin + 90, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Project:', pageWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(ts.project_name, pageWidth / 2 + 60, y);

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Period:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${formatDateLong(ts.pay_period_start)}  -  ${formatDateLong(ts.pay_period_end)}`,
    margin + 90,
    y
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Type:', pageWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(ts.timesheet_type === 'hourly' ? 'Hourly' : 'Project', pageWidth / 2 + 60, y);

  y += 25;

  // ========= Daily hours table
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Day', 'Hours Worked']],
    body: ts.daily_hours.map(d => [formatDateLong(d.date), d.day, d.hours.toFixed(2)]),
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [255, 122, 0], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: margin, right: margin },
    columnStyles: {
      2: { halign: 'right' },
    },
  });

  // jspdf-autotable v5 cursor
  // @ts-expect-error - lastAutoTable is added by plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 25;

  // ========= Totals block
  const taxLabel = ts.tax_percent && Number(ts.tax_percent) > 0
    ? `Tax (${Number(ts.tax_percent)}%)`
    : 'Tax';
  const rows: Array<[string, string]> = [
    ['Total Hours', ts.total_hours.toFixed(2)],
    ['Hourly Rate', formatCurrency(ts.hourly_rate)],
    ['Extra Amount', formatCurrency(ts.extra_amount)],
    ['Subtotal', formatCurrency(ts.subtotal)],
    [taxLabel, formatCurrency(ts.tax_amount)],
  ];

  autoTable(doc, {
    startY: y,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 200 },
      1: { halign: 'right' },
    },
    margin: { left: pageWidth - margin - 320, right: margin },
  });

  // @ts-expect-error - lastAutoTable is added by plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 5;

  // Total payment highlight
  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(1);
  doc.line(pageWidth - margin - 320, y, pageWidth - margin, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL PAYMENT', pageWidth - margin - 320, y);
  doc.text(formatCurrency(ts.total_payment), pageWidth - margin, y, { align: 'right' });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' }
    );
  }

  const safeName = ts.employee_name.replace(/[^a-z0-9]+/gi, '_');
  doc.save(`Timesheet_${safeName}_${ts.pay_period_start}_${ts.pay_period_end}.pdf`);
};
