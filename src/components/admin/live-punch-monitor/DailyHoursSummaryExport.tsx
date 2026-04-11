import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatDurationFromMinutes } from '@/hooks/useDailyHoursSummary';
import type { EmployeeBreakdown } from '@/hooks/useEmployeeHoursBreakdown';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DailyHoursSummaryExportProps {
  employees: EmployeeBreakdown[];
  startDate: Date;
  endDate: Date;
  grandTotalGrossMinutes: number;
  grandTotalNetMinutes: number;
  grandTotalBreakMinutes: number;
  companyName: string;
  timezone: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  incompleteCount: number;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

const fmtMins = (m: number) => formatDurationFromMinutes(m);

interface LocationEmployee {
  name: string;
  role: string;
  days: number;
  rawHrs: string;
  paidHrs: string;
  punches: number;
  issues: number;
  rawMins: number;
  paidMins: number;
  hourlyRate: number;
  amount: string;
}

interface LocationGroup {
  jobsite: string;
  employees: LocationEmployee[];
  totalRawMins: number;
  totalPaidMins: number;
  totalDays: number;
  totalPunches: number;
  totalIssues: number;
}

const buildLocationGroups = (employees: EmployeeBreakdown[]): LocationGroup[] => {
  // Map: jobsite -> employee -> aggregated stats
  const jobsiteMap = new Map<string, Map<string, { name: string; role: string; daySet: Set<string>; rawMins: number; paidMins: number; punches: number; issues: number; hourlyRate: number }>>();

  for (const emp of employees) {
    const name = `${emp.firstName} ${emp.lastName}`;
    for (const day of emp.days) {
      for (const p of day.punches) {
        const js = p.jobsiteName === '—' ? 'Unassigned' : p.jobsiteName;
        if (!jobsiteMap.has(js)) jobsiteMap.set(js, new Map());
        const empMap = jobsiteMap.get(js)!;
        if (!empMap.has(emp.userId)) {
          empMap.set(emp.userId, { name, role: emp.role, daySet: new Set(), rawMins: 0, paidMins: 0, punches: 0, issues: 0, hourlyRate: emp.hourlyRate });
        }
        const e = empMap.get(emp.userId)!;
        e.daySet.add(day.date);
        e.rawMins += p.isIncomplete ? 0 : p.grossMinutes;
        e.paidMins += p.isIncomplete ? 0 : p.netMinutes;
        e.punches += 1;
        if (p.isIncomplete) e.issues += 1;
      }
    }
  }

  const groups: LocationGroup[] = [];
  for (const [jobsite, empMap] of jobsiteMap) {
    const locEmps: LocationEmployee[] = [];
    let totalRawMins = 0, totalPaidMins = 0, totalDays = 0, totalPunches = 0, totalIssues = 0;
    for (const [, e] of empMap) {
      const days = e.daySet.size;
      const amount = e.hourlyRate > 0 ? ((e.paidMins / 60) * e.hourlyRate).toFixed(2) : '—';
      locEmps.push({ name: e.name, role: e.role, days, rawHrs: fmtMins(e.rawMins), paidHrs: fmtMins(e.paidMins), punches: e.punches, issues: e.issues, rawMins: e.rawMins, paidMins: e.paidMins, hourlyRate: e.hourlyRate, amount });
      totalRawMins += e.rawMins;
      totalPaidMins += e.paidMins;
      totalDays += days;
      totalPunches += e.punches;
      totalIssues += e.issues;
    }
    locEmps.sort((a, b) => a.name.localeCompare(b.name));
    groups.push({ jobsite, employees: locEmps, totalRawMins, totalPaidMins, totalDays, totalPunches, totalIssues });
  }
  groups.sort((a, b) => a.jobsite.localeCompare(b.jobsite));
  return groups;
};

const HEADERS = ['Employee', 'Role', 'Days', 'Raw Hrs', 'Paid Hrs', 'Punches', 'Issues', 'Rate', 'Amount'];

const DailyHoursSummaryExport: React.FC<DailyHoursSummaryExportProps> = ({
  employees,
  startDate,
  endDate,
  grandTotalGrossMinutes,
  grandTotalNetMinutes,
  grandTotalBreakMinutes,
  companyName,
  timezone,
  companyAddress,
  companyPhone,
  companyEmail,
  incompleteCount,
}) => {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const dateLabel = `${format(startDate, 'MMM dd yyyy')} - ${format(endDate, 'MMM dd yyyy')}`;
  const fileName = `Payroll_Summary_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}`;
  const generatedAt = format(new Date(), 'MMM dd, yyyy h:mm a');
  const groups = buildLocationGroups(employees);
  const totalLocations = groups.length;
  const totalEmployees = employees.length;
  const grandTotalAmount = employees.reduce((s, e) => s + (e.hourlyRate > 0 ? (e.totalNetMinutes / 60) * e.hourlyRate : 0), 0);
  const grandTotalPunches = groups.reduce((s, g) => s + g.totalPunches, 0);

  /* ── CSV ── */
  const exportCSV = () => {
    const lines: string[] = [];
    lines.push(`"${companyName}"`);
    if (companyAddress) lines.push(`"${companyAddress}"`);
    if (companyPhone) lines.push(`"Phone: ${companyPhone}"`);
    if (companyEmail) lines.push(`"Email: ${companyEmail}"`);
    lines.push('"Payroll Summary Report"');
    lines.push(`"Period: ${dateLabel}"`);
    lines.push(`"Generated: ${generatedAt}"`);
    lines.push(`"Timezone: ${timezone}"`);
    lines.push('');
    lines.push(`Locations,${totalLocations},Employees,${totalEmployees},Total Paid Hours,"${fmtMins(grandTotalNetMinutes)}",Issues,${incompleteCount}`);
    lines.push('');

    for (const g of groups) {
      lines.push(`"Location: ${g.jobsite}"`);
      lines.push(HEADERS.join(','));
      for (const e of g.employees) {
        lines.push([`"${e.name}"`, e.role, e.days, e.rawHrs, e.paidHrs, e.punches, e.issues, e.hourlyRate > 0 ? `$${e.hourlyRate}` : '—', e.amount !== '—' ? `$${e.amount}` : '—'].join(','));
      }
      lines.push(['SUBTOTAL', '', g.totalDays, fmtMins(g.totalRawMins), fmtMins(g.totalPaidMins), g.totalPunches, g.totalIssues, '', ''].join(','));
      lines.push('');
    }

    lines.push('GRAND TOTALS');
    lines.push(`Total Employees,${totalEmployees}`);
    lines.push(`Total Locations,${totalLocations}`);
    lines.push(`Total Raw Hours,"${fmtMins(grandTotalGrossMinutes)}"`);
    lines.push(`Total Paid Hours,"${fmtMins(grandTotalNetMinutes)}"`);
    lines.push(`Total Punches,${grandTotalPunches}`);
    lines.push(`Total Issues,${incompleteCount}`);
    lines.push(`Total Amount,"${grandTotalAmount > 0 ? `$${grandTotalAmount.toFixed(2)}` : '—'}"`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, `${fileName}.csv`);
  };

  /* ── Excel ── */
  const exportExcel = async () => {
    const XLSX = await import('xlsx-js-style');
    const wb = XLSX.utils.book_new();

    const titleStyle = { font: { bold: true, sz: 16, color: { rgb: '000000' } } };
    const subtitleStyle = { font: { bold: true, sz: 12, color: { rgb: '666666' } } };
    const metaStyle = { font: { sz: 10, color: { rgb: '444444' } } };
    const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 }, fill: { fgColor: { rgb: 'F97316' } }, alignment: { horizontal: 'center' as const } };
    const subtotalStyle = { font: { bold: true, sz: 10 }, fill: { fgColor: { rgb: 'FFF3E0' } } };
    const grandStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'F97316' } }, alignment: { horizontal: 'center' as const } };
    const locationStyle = { font: { bold: true, sz: 11, color: { rgb: 'F97316' } } };
    const statLabelStyle = { font: { bold: true, sz: 10, color: { rgb: '444444' } } };
    const statValueStyle = { font: { bold: true, sz: 14, color: { rgb: '000000' } } };

    const wsData: any[][] = [];
    const colCount = HEADERS.length;

    // Header block
    wsData.push([{ v: companyName, s: titleStyle }]);
    if (companyAddress) wsData.push([{ v: companyAddress, s: metaStyle }]);
    if (companyPhone || companyEmail) wsData.push([{ v: [companyPhone ? `Phone: ${companyPhone}` : '', companyEmail ? `Email: ${companyEmail}` : ''].filter(Boolean).join('  |  '), s: metaStyle }]);
    wsData.push([{ v: 'Payroll Summary Report', s: subtitleStyle }]);
    wsData.push([{ v: `Period: ${dateLabel}`, s: metaStyle }]);
    wsData.push([{ v: `Generated: ${generatedAt}  |  Timezone: ${timezone}`, s: metaStyle }]);
    wsData.push([]);

    // Summary stats row
    wsData.push([
      { v: 'Locations', s: statLabelStyle }, { v: totalLocations, s: statValueStyle }, { v: '' },
      { v: 'Employees', s: statLabelStyle }, { v: totalEmployees, s: statValueStyle }, { v: '' },
      { v: 'Paid Hours', s: statLabelStyle }, { v: fmtMins(grandTotalNetMinutes), s: statValueStyle },
      { v: 'Issues', s: statLabelStyle },
    ]);
    wsData.push([]);

    // Location groups
    for (const g of groups) {
      wsData.push([{ v: `Location: ${g.jobsite}`, s: locationStyle }]);
      wsData.push(HEADERS.map(h => ({ v: h, s: headerStyle })));
      for (const e of g.employees) {
        wsData.push([
          e.name, e.role, e.days, e.rawHrs, e.paidHrs, e.punches, e.issues,
          e.hourlyRate > 0 ? `$${e.hourlyRate.toFixed(2)}` : '—',
          e.amount !== '—' ? `$${e.amount}` : '—',
        ]);
      }
      wsData.push([
        { v: 'SUBTOTAL', s: subtotalStyle }, { v: '', s: subtotalStyle },
        { v: g.totalDays, s: subtotalStyle }, { v: fmtMins(g.totalRawMins), s: subtotalStyle },
        { v: fmtMins(g.totalPaidMins), s: subtotalStyle }, { v: g.totalPunches, s: subtotalStyle },
        { v: g.totalIssues, s: subtotalStyle }, { v: '', s: subtotalStyle }, { v: '', s: subtotalStyle },
      ]);
      wsData.push([]);
    }

    // Grand totals
    wsData.push([
      { v: 'GRAND TOTALS', s: grandStyle }, { v: '', s: grandStyle }, { v: '', s: grandStyle },
      { v: '', s: grandStyle }, { v: '', s: grandStyle }, { v: '', s: grandStyle },
      { v: '', s: grandStyle }, { v: '', s: grandStyle }, { v: '', s: grandStyle },
    ]);
    wsData.push([
      { v: 'Total Employees', s: statLabelStyle }, { v: totalEmployees, s: statValueStyle }, { v: '' },
      { v: 'Total Locations', s: statLabelStyle }, { v: totalLocations, s: statValueStyle }, { v: '' },
      { v: 'Total Raw Hours', s: statLabelStyle }, { v: fmtMins(grandTotalGrossMinutes), s: statValueStyle }, { v: '' },
    ]);
    wsData.push([
      { v: 'Total Paid Hours', s: statLabelStyle }, { v: fmtMins(grandTotalNetMinutes), s: statValueStyle }, { v: '' },
      { v: 'Total Punches', s: statLabelStyle }, { v: grandTotalPunches, s: statValueStyle }, { v: '' },
      { v: 'Total Issues', s: statLabelStyle }, { v: incompleteCount, s: statValueStyle }, { v: '' },
    ]);
    wsData.push([
      { v: 'Total Amount', s: statLabelStyle }, { v: grandTotalAmount > 0 ? `$${grandTotalAmount.toFixed(2)}` : '—', s: statValueStyle },
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 8 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  /* ── PDF ── */
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pw = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let rightY = 10;
    if (companyAddress) { doc.text(companyAddress, pw - 14, rightY, { align: 'right' }); rightY += 5; }
    if (companyPhone) { doc.text(`Phone: ${companyPhone}`, pw - 14, rightY, { align: 'right' }); rightY += 5; }
    if (companyEmail) { doc.text(`Email: ${companyEmail}`, pw - 14, rightY, { align: 'right' }); rightY += 5; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Payroll Summary Report', 14, 22);
    doc.setFontSize(9);
    doc.text(`Period: ${dateLabel}`, 14, 28);
    doc.text(`Generated: ${generatedAt}  |  Timezone: ${timezone}`, 14, 33);

    // Summary stat boxes
    let yPos = 40;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const stats = [
      { label: 'Locations', value: String(totalLocations) },
      { label: 'Employees', value: String(totalEmployees) },
      { label: 'Paid Hours', value: fmtMins(grandTotalNetMinutes) },
      { label: 'Issues', value: String(incompleteCount) },
    ];
    const boxW = 50, boxH = 14, gap = 8;
    stats.forEach((st, i) => {
      const x = 14 + i * (boxW + gap);
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, yPos, boxW, boxH, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text(st.label, x + 4, yPos + 5);
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(st.value, x + 4, yPos + 11);
    });
    doc.setTextColor(0);
    yPos += boxH + 8;

    // Location tables
    for (const g of groups) {
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 15;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(249, 115, 22);
      doc.text(`Location: ${g.jobsite}`, 14, yPos);
      doc.setTextColor(0);
      yPos += 2;

      const body: string[][] = [];
      for (const e of g.employees) {
        body.push([e.name, e.role, String(e.days), e.rawHrs, e.paidHrs, String(e.punches), String(e.issues), e.hourlyRate > 0 ? `$${e.hourlyRate.toFixed(2)}` : '—', e.amount !== '—' ? `$${e.amount}` : '—']);
      }
      body.push(['SUBTOTAL', '', String(g.totalDays), fmtMins(g.totalRawMins), fmtMins(g.totalPaidMins), String(g.totalPunches), String(g.totalIssues), '', '']);

      const tableResult = autoTable(doc, {
        startY: yPos,
        head: [HEADERS],
        body,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.row.index === body.length - 1 && data.row.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255, 243, 224];
          }
        },
      });

      yPos = (tableResult as any).finalY + 10;
    }

    // Grand totals
    if (yPos > doc.internal.pageSize.getHeight() - 45) {
      doc.addPage();
      yPos = 15;
    }

    doc.setFillColor(249, 115, 22);
    doc.rect(14, yPos, pw - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTALS', 18, yPos + 6);
    doc.setTextColor(0);
    yPos += 14;

    doc.setFontSize(8);
    const leftCol = [
      ['Total Employees', String(totalEmployees)],
      ['Total Locations', String(totalLocations)],
      ['Total Days Worked', String(groups.reduce((s, g) => s + g.totalDays, 0))],
      ['Total Raw Hours', fmtMins(grandTotalGrossMinutes)],
    ];
    const rightCol = [
      ['Total Paid Hours', fmtMins(grandTotalNetMinutes)],
      ['Total Punches', String(grandTotalPunches)],
      ['Total Issues', String(incompleteCount)],
      ['Total Amount', grandTotalAmount > 0 ? `$${grandTotalAmount.toFixed(2)}` : '—'],
    ];
    const midX = pw / 2;
    leftCol.forEach(([label, val], i) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label + ':', 18, yPos + i * 6);
      doc.setFont('helvetica', 'bold');
      doc.text(val, 70, yPos + i * 6);
    });
    rightCol.forEach(([label, val], i) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label + ':', midX, yPos + i * 6);
      doc.setFont('helvetica', 'bold');
      doc.text(val, midX + 52, yPos + i * 6);
    });

    doc.save(`${fileName}.pdf`);
  };

  const handleExport = async (fmt: ExportFormat) => {
    setExporting(fmt);
    try {
      if (fmt === 'csv') exportCSV();
      else if (fmt === 'excel') await exportExcel();
      else exportPDF();
      toast.success(`${fmt.toUpperCase()} exported successfully`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={!!exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
          <FileText className="h-4 w-4" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
          <FileText className="h-4 w-4" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DailyHoursSummaryExport;
