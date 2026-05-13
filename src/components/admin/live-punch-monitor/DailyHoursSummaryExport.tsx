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
import { parseLocalDate } from '@/utils/dateUtils';
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
  userRole?: string;
}

type ExportFormat = 'excel-complete' | 'excel-overview' | 'pdf-complete' | 'pdf-overview';

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
  userRole,
}) => {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const isForemanOnly = userRole === 'foreman';

  const dateLabel = `${format(startDate, 'MMM dd yyyy')} - ${format(endDate, 'MMM dd yyyy')}`;
  const fileName = `Payroll_Summary_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}`;
  const generatedAt = format(new Date(), 'MMM dd, yyyy h:mm a');
  const groups = buildLocationGroups(employees);
  const totalLocations = groups.length;
  const totalEmployees = employees.length;
  const grandTotalAmount = employees.reduce((s, e) => s + (e.hourlyRate > 0 ? (e.totalNetMinutes / 60) * e.hourlyRate : 0), 0);
  const grandTotalPunches = groups.reduce((s, g) => s + g.totalPunches, 0);

  /* ── Excel Overview (jobsite-grouped, existing logic) ── */
  const exportExcelOverview = async () => {
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

    wsData.push([{ v: companyName, s: titleStyle }]);
    if (companyAddress) wsData.push([{ v: companyAddress, s: metaStyle }]);
    if (companyPhone || companyEmail) wsData.push([{ v: [companyPhone ? `Phone: ${companyPhone}` : '', companyEmail ? `Email: ${companyEmail}` : ''].filter(Boolean).join('  |  '), s: metaStyle }]);
    wsData.push([{ v: 'Payroll Summary Report', s: subtitleStyle }]);
    wsData.push([{ v: `Period: ${dateLabel}`, s: metaStyle }]);
    wsData.push([{ v: `Generated: ${generatedAt}  |  Timezone: ${timezone}`, s: metaStyle }]);
    wsData.push([]);

    wsData.push([
      { v: 'Locations', s: statLabelStyle }, { v: totalLocations, s: statValueStyle }, { v: '' },
      { v: 'Employees', s: statLabelStyle }, { v: totalEmployees, s: statValueStyle }, { v: '' },
      { v: 'Paid Hours', s: statLabelStyle }, { v: fmtMins(grandTotalNetMinutes), s: statValueStyle },
      { v: 'Issues', s: statLabelStyle },
    ]);
    wsData.push([]);

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

  /* ── Excel Complete (green-themed per-employee breakdown) ── */
  const exportExcelComplete = async () => {
    const XLSX = await import('xlsx-js-style');
    const wb = XLSX.utils.book_new();

    // Green theme styles matching screenshot
    const titleStyle = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '548235' } } };
    const metaStyle = { font: { sz: 10, color: { rgb: '444444' } } };
    const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 }, fill: { fgColor: { rgb: '548235' } }, alignment: { horizontal: 'center' as const } };
    const empNameStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '70AD47' } } };
    const rowEvenStyle = { fill: { fgColor: { rgb: 'E2EFDA' } } };
    const subtotalStyle = { font: { bold: true, sz: 10 }, fill: { fgColor: { rgb: 'C6EFCE' } }, border: { top: { style: 'thin', color: { rgb: '548235' } } } };
    const grandStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '548235' } }, alignment: { horizontal: 'center' as const } };

    const DETAIL_HEADERS = ['Employee', 'Date', 'Start', 'End', 'Break (min)', 'Raw Hours', 'Paid Hours', 'Jobsite', 'Notes'];
    const wsData: any[][] = [];

    // Title row
    const titleRow = DETAIL_HEADERS.map((_, i) => i === 0
      ? { v: `Hours Summary — ${dateLabel}`, s: titleStyle }
      : { v: '', s: titleStyle }
    );
    wsData.push(titleRow);

    // Company info
    wsData.push([{ v: companyName, s: metaStyle }]);
    const contactParts = [companyAddress, companyPhone ? `Phone: ${companyPhone}` : '', companyEmail ? `Email: ${companyEmail}` : ''].filter(Boolean);
    if (contactParts.length) wsData.push([{ v: contactParts.join('  |  '), s: metaStyle }]);
    wsData.push([{ v: `Generated: ${generatedAt}  |  Timezone: ${timezone}`, s: metaStyle }]);
    wsData.push([]);

    // Column headers
    wsData.push(DETAIL_HEADERS.map(h => ({ v: h, s: headerStyle })));

    let grandRawMins = 0;
    let grandPaidMins = 0;
    let grandBreakMins = 0;

    const sortedEmployees = [...employees].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );

    for (const emp of sortedEmployees) {
      const empName = `${emp.firstName} ${emp.lastName}`;

      // Employee name header row
      wsData.push(DETAIL_HEADERS.map((_, i) => i === 0
        ? { v: empName, s: empNameStyle }
        : { v: '', s: empNameStyle }
      ));

      let empRawMins = 0;
      let empPaidMins = 0;
      let empBreakMins = 0;
      let rowIdx = 0;

      for (const day of emp.days) {
        for (const p of day.punches) {
          const dateStr = format(parseLocalDate(day.date), 'EEE MMM dd');
          const startTime = p.checkIn ? format(new Date(p.checkIn), 'h:mm a') : '—';
          const endTime = p.checkOut ? format(new Date(p.checkOut), 'h:mm a') : '—';
          const breakVal = p.breakMinutes;
          const rawStr = p.isIncomplete ? '—' : fmtMins(p.grossMinutes);
          const paidStr = p.isIncomplete ? '—' : fmtMins(p.netMinutes);
          const jobsite = p.jobsiteName === '—' ? 'Unassigned' : p.jobsiteName;

          const useAlt = rowIdx % 2 === 0;
          const cellStyle = useAlt ? rowEvenStyle : {};

          wsData.push([
            { v: empName, s: cellStyle },
            { v: dateStr, s: cellStyle },
            { v: startTime, s: cellStyle },
            { v: endTime, s: cellStyle },
            { v: breakVal, s: cellStyle },
            { v: rawStr, s: cellStyle },
            { v: paidStr, s: cellStyle },
            { v: jobsite, s: cellStyle },
            { v: p.note || '', s: { ...cellStyle, alignment: { wrapText: true, vertical: 'top' as const } } },
          ]);

          if (!p.isIncomplete) {
            empRawMins += p.grossMinutes;
            empPaidMins += p.netMinutes;
          }
          empBreakMins += breakVal;
          rowIdx++;
        }
      }

      // Employee subtotal row
      wsData.push([
        { v: 'SUBTOTAL', s: subtotalStyle },
        { v: '', s: subtotalStyle },
        { v: '', s: subtotalStyle },
        { v: '', s: subtotalStyle },
        { v: empBreakMins, s: subtotalStyle },
        { v: fmtMins(empRawMins), s: subtotalStyle },
        { v: fmtMins(empPaidMins), s: subtotalStyle },
        { v: '', s: subtotalStyle },
        { v: '', s: subtotalStyle },
      ]);

      grandRawMins += empRawMins;
      grandPaidMins += empPaidMins;
      grandBreakMins += empBreakMins;
    }

    // Grand total row
    wsData.push([
      { v: 'GRAND TOTAL', s: grandStyle },
      { v: '', s: grandStyle },
      { v: '', s: grandStyle },
      { v: '', s: grandStyle },
      { v: grandBreakMins, s: grandStyle },
      { v: fmtMins(grandRawMins), s: grandStyle },
      { v: fmtMins(grandPaidMins), s: grandStyle },
      { v: '', s: grandStyle },
      { v: '', s: grandStyle },
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 40 },
    ];

    // Merge title row
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: DETAIL_HEADERS.length - 1 } }];

    XLSX.utils.book_append_sheet(wb, ws, 'Employee Details');
    XLSX.writeFile(wb, `${fileName}_Complete.xlsx`);
  };

  /* ── PDF Overview (jobsite-grouped) ── */
  const exportPDFOverview = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pw = doc.internal.pageSize.getWidth();

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

      autoTable(doc, {
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

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

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

  /* ── PDF Complete (per-employee daily breakdown) ── */
  const exportPDFComplete = () => {
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
    doc.text('Payroll Detail Report', 14, 22);
    doc.setFontSize(9);
    doc.text(`Period: ${dateLabel}`, 14, 28);
    doc.text(`Generated: ${generatedAt}  |  Timezone: ${timezone}`, 14, 33);

    let yPos = 40;
    const PDF_HEADERS = ['Date', 'Start', 'End', 'Break (min)', 'Raw Hours', 'Paid Hours', 'Jobsite', 'Notes'];

    let grandRawMins = 0;
    let grandPaidMins = 0;
    let grandBreakMins = 0;

    const sortedEmployees = [...employees].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );

    for (const emp of sortedEmployees) {
      const empName = `${emp.firstName} ${emp.lastName}`;

      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 15;
      }

      // Employee name header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(84, 130, 53); // green
      doc.text(empName, 14, yPos);
      doc.setTextColor(0);
      yPos += 2;

      const body: string[][] = [];
      let empRawMins = 0;
      let empPaidMins = 0;
      let empBreakMins = 0;

      for (const day of emp.days) {
        for (const p of day.punches) {
          const dateStr = format(parseLocalDate(day.date), 'EEE MMM dd');
          const startTime = p.checkIn ? format(new Date(p.checkIn), 'h:mm a') : '—';
          const endTime = p.checkOut ? format(new Date(p.checkOut), 'h:mm a') : '—';
          const breakVal = String(p.breakMinutes);
          const rawStr = p.isIncomplete ? '—' : fmtMins(p.grossMinutes);
          const paidStr = p.isIncomplete ? '—' : fmtMins(p.netMinutes);
          const jobsite = p.jobsiteName === '—' ? 'Unassigned' : p.jobsiteName;

          body.push([dateStr, startTime, endTime, breakVal, rawStr, paidStr, jobsite, p.note || '']);

          if (!p.isIncomplete) {
            empRawMins += p.grossMinutes;
            empPaidMins += p.netMinutes;
          }
          empBreakMins += p.breakMinutes;
        }
      }

      // Subtotal row
      body.push(['SUBTOTAL', '', '', String(empBreakMins), fmtMins(empRawMins), fmtMins(empPaidMins), '', '']);

      autoTable(doc, {
        startY: yPos,
        head: [PDF_HEADERS],
        body,
        theme: 'striped',
        headStyles: { fillColor: [84, 130, 53], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 7: { cellWidth: 60 } },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.row.index === body.length - 1 && data.row.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [198, 239, 206];
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
      grandRawMins += empRawMins;
      grandPaidMins += empPaidMins;
      grandBreakMins += empBreakMins;
    }

    // Grand totals
    if (yPos > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPos = 15;
    }

    doc.setFillColor(84, 130, 53);
    doc.rect(14, yPos, pw - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL', 18, yPos + 6);
    doc.setTextColor(0);
    yPos += 14;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Break:', 18, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${grandBreakMins} min`, 60, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text('Total Raw Hours:', 100, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtMins(grandRawMins), 150, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text('Total Paid Hours:', 180, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtMins(grandPaidMins), 230, yPos);

    doc.save(`${fileName}_Complete.pdf`);
  };

  const handleExport = async (fmt: ExportFormat) => {
    setExporting(fmt);
    try {
      if (fmt === 'excel-overview') await exportExcelOverview();
      else if (fmt === 'excel-complete') await exportExcelComplete();
      else if (fmt === 'pdf-overview') exportPDFOverview();
      else if (fmt === 'pdf-complete') exportPDFComplete();
      toast.success(`Export completed successfully`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
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
        <DropdownMenuItem onClick={() => handleExport('excel-complete')} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Excel (Complete)
        </DropdownMenuItem>
        {!isForemanOnly && (
          <>
            <DropdownMenuItem onClick={() => handleExport('excel-overview')} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Excel (Overview)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf-complete')} className="gap-2">
              <FileText className="h-4 w-4" /> PDF (Complete)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf-overview')} className="gap-2">
              <FileText className="h-4 w-4" /> PDF (Overview)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DailyHoursSummaryExport;
