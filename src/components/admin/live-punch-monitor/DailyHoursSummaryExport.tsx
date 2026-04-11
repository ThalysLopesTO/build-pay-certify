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
import 'jspdf-autotable';

interface DailyHoursSummaryExportProps {
  employees: EmployeeBreakdown[];
  startDate: Date;
  endDate: Date;
  grandTotalGrossMinutes: number;
  grandTotalNetMinutes: number;
  grandTotalBreakMinutes: number;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

const formatMins = (m: number) => formatDurationFromMinutes(m);

const buildFlatRows = (employees: EmployeeBreakdown[]) => {
  const rows: Array<{
    employee: string;
    date: string;
    start: string;
    end: string;
    breakMin: number;
    rawHours: string;
    paidHours: string;
    jobsite: string;
    isSubtotal?: boolean;
    isGrand?: boolean;
  }> = [];

  for (const emp of employees) {
    const name = `${emp.firstName} ${emp.lastName}`;
    for (const day of emp.days) {
      for (const p of day.punches) {
        rows.push({
          employee: name,
          date: format(new Date(day.date + 'T00:00:00'), 'MMM dd, yyyy'),
          start: format(new Date(p.checkIn), 'h:mm a'),
          end: p.isIncomplete ? 'Missing' : format(new Date(p.checkOut!), 'h:mm a'),
          breakMin: p.breakMinutes,
          rawHours: p.isIncomplete ? '—' : formatMins(p.grossMinutes),
          paidHours: p.isIncomplete ? '—' : formatMins(p.netMinutes),
          jobsite: p.jobsiteName === '—' ? '' : p.jobsiteName,
        });
      }
    }
    rows.push({
      employee: name,
      date: '',
      start: '',
      end: 'SUBTOTAL',
      breakMin: emp.totalBreakMinutes,
      rawHours: formatMins(emp.totalGrossMinutes),
      paidHours: formatMins(emp.totalNetMinutes),
      jobsite: '',
      isSubtotal: true,
    });
  }

  return rows;
};

const HEADERS = ['Employee', 'Date', 'Start', 'End', 'Break (min)', 'Raw Hours', 'Paid Hours', 'Jobsite'];

const DailyHoursSummaryExport: React.FC<DailyHoursSummaryExportProps> = ({
  employees,
  startDate,
  endDate,
  grandTotalGrossMinutes,
  grandTotalNetMinutes,
  grandTotalBreakMinutes,
}) => {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const dateLabel = `${format(startDate, 'MMM dd yyyy')} - ${format(endDate, 'MMM dd yyyy')}`;
  const fileName = `Hours_Summary_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}`;

  const exportCSV = () => {
    const rows = buildFlatRows(employees);
    const lines = [HEADERS.join(',')];
    for (const r of rows) {
      lines.push([r.employee, r.date, r.start, r.end, String(r.breakMin), r.rawHours, r.paidHours, `"${r.jobsite}"`].join(','));
    }
    lines.push(['GRAND TOTAL', '', '', '', String(Math.round(grandTotalBreakMinutes)), formatMins(grandTotalGrossMinutes), formatMins(grandTotalNetMinutes), ''].join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, `${fileName}.csv`);
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx-js-style');
    const wb = XLSX.utils.book_new();

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: 'F97316' } },
      alignment: { horizontal: 'center' as const },
    };
    const subtotalStyle = {
      font: { bold: true, sz: 10 },
      fill: { fgColor: { rgb: 'FFF3E0' } },
    };
    const grandStyle = {
      font: { bold: true, sz: 11 },
      fill: { fgColor: { rgb: 'F97316' } },
      alignment: { horizontal: 'center' as const },
    };

    const wsData: any[][] = [];
    // Title row
    wsData.push([{ v: `Hours Summary — ${dateLabel}`, s: { font: { bold: true, sz: 14 } } }]);
    wsData.push([]);

    // Header row
    wsData.push(HEADERS.map(h => ({ v: h, s: headerStyle })));

    const rows = buildFlatRows(employees);
    for (const r of rows) {
      if (r.isSubtotal) {
        wsData.push([
          { v: r.employee, s: subtotalStyle },
          { v: '', s: subtotalStyle },
          { v: '', s: subtotalStyle },
          { v: 'SUBTOTAL', s: subtotalStyle },
          { v: Math.round(r.breakMin), s: subtotalStyle },
          { v: r.rawHours, s: subtotalStyle },
          { v: r.paidHours, s: subtotalStyle },
          { v: '', s: subtotalStyle },
        ]);
      } else {
        wsData.push([r.employee, r.date, r.start, r.end, r.breakMin, r.rawHours, r.paidHours, r.jobsite]);
      }
    }

    // Grand total
    wsData.push([]);
    wsData.push([
      { v: 'GRAND TOTAL', s: grandStyle },
      { v: '', s: grandStyle },
      { v: '', s: grandStyle },
      { v: '', s: grandStyle },
      { v: Math.round(grandTotalBreakMinutes), s: grandStyle },
      { v: formatMins(grandTotalGrossMinutes), s: grandStyle },
      { v: formatMins(grandTotalNetMinutes), s: grandStyle },
      { v: '', s: grandStyle },
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    ];
    // Merge title
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    XLSX.utils.book_append_sheet(wb, ws, 'Hours Summary');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text('Hours Summary', 14, 15);
    doc.setFontSize(10);
    doc.text(dateLabel, 14, 22);

    let yPos = 30;

    for (const emp of employees) {
      const name = `${emp.firstName} ${emp.lastName}`;

      // Check if we need a new page
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 15;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(name, 14, yPos);
      yPos += 2;

      const body: string[][] = [];
      for (const day of emp.days) {
        for (const p of day.punches) {
          body.push([
            format(new Date(day.date + 'T00:00:00'), 'MMM dd, yyyy'),
            format(new Date(p.checkIn), 'h:mm a'),
            p.isIncomplete ? 'Missing' : format(new Date(p.checkOut!), 'h:mm a'),
            `${p.breakMinutes}m`,
            p.isIncomplete ? '—' : formatMins(p.grossMinutes),
            p.isIncomplete ? '—' : formatMins(p.netMinutes),
            p.jobsiteName === '—' ? '' : p.jobsiteName,
          ]);
        }
      }

      // Subtotal row
      body.push([
        '', '', 'SUBTOTAL',
        formatMins(emp.totalBreakMinutes),
        formatMins(emp.totalGrossMinutes),
        formatMins(emp.totalNetMinutes),
        '',
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Date', 'Start', 'End', 'Break', 'Raw Hours', 'Paid Hours', 'Jobsite']],
        body,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          // Bold subtotal row
          if (data.row.index === body.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [255, 243, 224];
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Grand total
    if (yPos > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      yPos = 15;
    }

    (doc as any).autoTable({
      startY: yPos,
      head: [['', '', '', 'Break', 'Raw Hours', 'Paid Hours', '']],
      body: [['GRAND TOTAL', '', '', formatMins(grandTotalBreakMinutes), formatMins(grandTotalGrossMinutes), formatMins(grandTotalNetMinutes), '']],
      theme: 'plain',
      headStyles: { fillColor: [249, 115, 22], fontSize: 8, textColor: [255, 255, 255] },
      styles: { fontSize: 10, fontStyle: 'bold', cellPadding: 3 },
      margin: { left: 14, right: 14 },
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
