import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { JobsiteSummaryWithRules } from './useTimeSummaryDataWithRules';
import { useTimeSummaryPDF } from './useTimeSummaryPDF';
import { useCompanySettings } from './useCompanySettings';
import XLSX from 'xlsx-js-style';

interface ExportParams {
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  dateRange: { start: Date; end: Date };
  jobsiteFilter?: string[];
  employeeFilter?: string[];
  timezone: string;
  data: JobsiteSummaryWithRules[];
  filters?: {
    employeeNames?: string[];
    jobsiteNames?: string[];
    status?: string;
  };
}

interface ExportResult {
  isExporting: boolean;
  exportPayrollCSV: () => Promise<void>;
  exportPayrollExcel: () => Promise<void>;
  exportPayrollPDF: () => Promise<void>;
  error: Error | null;
}

interface JobsiteGroup {
  jobsiteName: string;
  employees: {
    employeeName: string;
    employeeRole: string;
    totalPaidHours: number;
    daysWorked: number;
  }[];
  subtotalPaidHours: number;
  subtotalDaysWorked: number;
}

// Style definitions
const STYLES = {
  companyName: {
    font: { bold: true, sz: 16, color: { rgb: "000000" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
  },
  reportTitle: {
    font: { bold: true, sz: 12, color: { rgb: "666666" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
  },
  jobsiteHeader: {
    fill: { fgColor: { rgb: "F97316" } },
    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
  },
  columnHeader: {
    fill: { fgColor: { rgb: "F3F4F6" } },
    font: { bold: true, sz: 10, color: { rgb: "374151" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
    border: {
      top: { style: "thin" as const, color: { rgb: "D1D5DB" } },
      bottom: { style: "thin" as const, color: { rgb: "D1D5DB" } },
      left: { style: "thin" as const, color: { rgb: "D1D5DB" } },
      right: { style: "thin" as const, color: { rgb: "D1D5DB" } },
    },
  },
  dataCell: {
    font: { sz: 10, color: { rgb: "374151" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
    border: {
      top: { style: "thin" as const, color: { rgb: "E5E7EB" } },
      bottom: { style: "thin" as const, color: { rgb: "E5E7EB" } },
      left: { style: "thin" as const, color: { rgb: "E5E7EB" } },
      right: { style: "thin" as const, color: { rgb: "E5E7EB" } },
    },
  },
  subtotalRow: {
    fill: { fgColor: { rgb: "FED7AA" } },
    font: { bold: true, sz: 10, color: { rgb: "9A3412" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
    border: {
      top: { style: "thin" as const, color: { rgb: "FDBA74" } },
      bottom: { style: "thin" as const, color: { rgb: "FDBA74" } },
      left: { style: "thin" as const, color: { rgb: "FDBA74" } },
      right: { style: "thin" as const, color: { rgb: "FDBA74" } },
    },
  },
  grandTotal: {
    fill: { fgColor: { rgb: "F97316" } },
    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
    border: {
      top: { style: "medium" as const, color: { rgb: "EA580C" } },
      bottom: { style: "medium" as const, color: { rgb: "EA580C" } },
      left: { style: "medium" as const, color: { rgb: "EA580C" } },
      right: { style: "medium" as const, color: { rgb: "EA580C" } },
    },
  },
  labelCell: {
    font: { bold: true, sz: 10, color: { rgb: "6B7280" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
  },
  valueCell: {
    font: { sz: 10, color: { rgb: "111827" } },
    alignment: { horizontal: "left" as const, vertical: "center" as const },
  },
};

/**
 * Escapes and quotes a CSV field if necessary
 */
function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of values to a CSV row
 */
function arrayToCsvRow(values: (string | number)[]): string {
  return values.map(escapeCsvField).join(',');
}

/**
 * Safely converts a value to a number, returning 0 if NaN or invalid
 */
function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Groups data by jobsite with subtotals
 */
function groupDataByJobsite(data: JobsiteSummaryWithRules[]): JobsiteGroup[] {
  const groups: JobsiteGroup[] = [];

  data.forEach(jobsite => {
    const employees = jobsite.employees.map(employee => {
      const role = employee.employee_position || 
                   employee.employee_trade || 
                   employee.employee_role || 
                   'Employee';
      return {
        employeeName: employee.employee_name,
        employeeRole: role,
        totalPaidHours: safeNumber(employee.total_paid_hours),
        daysWorked: safeNumber(employee.days_worked),
      };
    });

    // Sort employees by name
    employees.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    const subtotalPaidHours = employees.reduce((sum, e) => sum + e.totalPaidHours, 0);
    const subtotalDaysWorked = employees.reduce((sum, e) => sum + e.daysWorked, 0);

    groups.push({
      jobsiteName: jobsite.jobsite_name,
      employees,
      subtotalPaidHours,
      subtotalDaysWorked,
    });
  });

  // Sort groups by jobsite name
  groups.sort((a, b) => a.jobsiteName.localeCompare(b.jobsiteName));

  return groups;
}

export function useTimeSummaryExport(params: ExportParams): ExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { generateTimeSummaryPDF } = useTimeSummaryPDF();
  const { settings } = useCompanySettings();

  const exportPayrollCSV = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const rows: string[] = [];
      const periodStartStr = format(params.dateRange.start, 'MMMM dd, yyyy');
      const periodEndStr = format(params.dateRange.end, 'MMMM dd, yyyy');
      const generatedAtStr = format(new Date(), 'MMMM dd, yyyy hh:mm a');
      const timezoneStr = params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // ========== HEADER SECTION ==========
      rows.push(arrayToCsvRow([params.companyName]));
      rows.push(arrayToCsvRow(['Payroll Summary Report']));
      rows.push(arrayToCsvRow(['']));
      rows.push(arrayToCsvRow(['Period Start:', periodStartStr]));
      rows.push(arrayToCsvRow(['Period End:', periodEndStr]));
      rows.push(arrayToCsvRow(['Generated:', generatedAtStr]));
      rows.push(arrayToCsvRow(['Timezone:', timezoneStr]));
      rows.push('');
      
      // ========== GROUP DATA BY JOBSITE ==========
      const groups = groupDataByJobsite(params.data);
      
      let grandTotalPaidHours = 0;
      let grandTotalDaysWorked = 0;
      
      // ========== WRITE GROUPED DATA ==========
      groups.forEach((group) => {
        // Jobsite header row - clean format matching Excel
        rows.push(arrayToCsvRow([group.jobsiteName, '', '', '']));
        
        // Column headers for this group
        rows.push(arrayToCsvRow(['Employee Name', 'Role', 'Paid Hours', 'Days Worked']));
        
        // Employee rows
        group.employees.forEach(emp => {
          rows.push(arrayToCsvRow([
            emp.employeeName,
            emp.employeeRole,
            emp.totalPaidHours.toFixed(2),
            emp.daysWorked.toString()
          ]));
        });
        
        // Jobsite subtotal
        rows.push(arrayToCsvRow([
          'Subtotal',
          '',
          group.subtotalPaidHours.toFixed(2),
          group.subtotalDaysWorked.toString()
        ]));
        rows.push('');
        
        grandTotalPaidHours += group.subtotalPaidHours;
        grandTotalDaysWorked += group.subtotalDaysWorked;
      });
      
      // ========== GRAND TOTALS ==========
      rows.push(arrayToCsvRow(['GRAND TOTAL', '', grandTotalPaidHours.toFixed(2), grandTotalDaysWorked.toString()]));
      
      // ========== DOWNLOAD CSV ==========
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `payroll-summary-${format(params.dateRange.start, 'yyyy-MM-dd')}_to_${format(params.dateRange.end, 'yyyy-MM-dd')}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'CSV Export Complete',
        description: `Payroll report downloaded: ${filename}`,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error);
      console.error('CSV Export Error:', error);
      
      toast({
        title: 'Export Failed',
        description: 'Unable to generate CSV report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [params, toast]);

  const exportPayrollExcel = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const periodStartStr = format(params.dateRange.start, 'MMMM dd, yyyy');
      const periodEndStr = format(params.dateRange.end, 'MMMM dd, yyyy');
      const generatedAtStr = format(new Date(), 'MMMM dd, yyyy hh:mm a');
      const timezoneStr = params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Track row indices for styling
      const jobsiteRows: number[] = [];
      const headerRows: number[] = [];
      const subtotalRows: number[] = [];
      const dataRows: number[] = [];
      let grandTotalRow = 0;
      
      // Build worksheet data
      const wsData: any[][] = [];
      const merges: XLSX.Range[] = [];
      
      // ========== HEADER SECTION ==========
      wsData.push([{ v: params.companyName, s: STYLES.companyName }, '', '', '']);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
      
      wsData.push([{ v: 'Payroll Summary Report', s: STYLES.reportTitle }, '', '', '']);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });
      
      wsData.push(['', '', '', '']);
      
      wsData.push([
        { v: 'Period Start:', s: STYLES.labelCell },
        { v: periodStartStr, s: STYLES.valueCell },
        '', ''
      ]);
      wsData.push([
        { v: 'Period End:', s: STYLES.labelCell },
        { v: periodEndStr, s: STYLES.valueCell },
        '', ''
      ]);
      wsData.push([
        { v: 'Generated:', s: STYLES.labelCell },
        { v: generatedAtStr, s: STYLES.valueCell },
        '', ''
      ]);
      wsData.push([
        { v: 'Timezone:', s: STYLES.labelCell },
        { v: timezoneStr, s: STYLES.valueCell },
        '', ''
      ]);
      wsData.push(['', '', '', '']);
      
      // ========== GROUP DATA BY JOBSITE ==========
      const groups = groupDataByJobsite(params.data);
      
      let grandTotalPaidHours = 0;
      let grandTotalDaysWorked = 0;
      
      // ========== WRITE GROUPED DATA ==========
      groups.forEach((group) => {
        // Jobsite header row - ORANGE background
        const jobsiteRowIdx = wsData.length;
        jobsiteRows.push(jobsiteRowIdx);
        wsData.push([
          { v: group.jobsiteName, s: STYLES.jobsiteHeader },
          { v: '', s: STYLES.jobsiteHeader },
          { v: '', s: STYLES.jobsiteHeader },
          { v: '', s: STYLES.jobsiteHeader }
        ]);
        merges.push({ s: { r: jobsiteRowIdx, c: 0 }, e: { r: jobsiteRowIdx, c: 3 } });
        
        // Column headers - GRAY background
        const headerRowIdx = wsData.length;
        headerRows.push(headerRowIdx);
        wsData.push([
          { v: 'Employee Name', s: STYLES.columnHeader },
          { v: 'Role', s: STYLES.columnHeader },
          { v: 'Paid Hours', s: STYLES.columnHeader },
          { v: 'Days Worked', s: STYLES.columnHeader }
        ]);
        
        // Employee rows - data cells with borders
        group.employees.forEach(emp => {
          const rowIdx = wsData.length;
          dataRows.push(rowIdx);
          wsData.push([
            { v: emp.employeeName, s: STYLES.dataCell },
            { v: emp.employeeRole, s: STYLES.dataCell },
            { v: emp.totalPaidHours, s: { ...STYLES.dataCell, numFmt: '0.00' } },
            { v: emp.daysWorked, s: { ...STYLES.dataCell, numFmt: '0' } }
          ]);
        });
        
        // Subtotal row - LIGHT ORANGE background
        const subtotalRowIdx = wsData.length;
        subtotalRows.push(subtotalRowIdx);
        wsData.push([
          { v: 'Subtotal', s: STYLES.subtotalRow },
          { v: '', s: STYLES.subtotalRow },
          { v: group.subtotalPaidHours, s: { ...STYLES.subtotalRow, numFmt: '0.00' } },
          { v: group.subtotalDaysWorked, s: { ...STYLES.subtotalRow, numFmt: '0' } }
        ]);
        
        // Empty row
        wsData.push(['', '', '', '']);
        
        grandTotalPaidHours += group.subtotalPaidHours;
        grandTotalDaysWorked += group.subtotalDaysWorked;
      });
      
      // ========== GRAND TOTALS - ORANGE background ==========
      grandTotalRow = wsData.length;
      wsData.push([
        { v: 'GRAND TOTAL', s: STYLES.grandTotal },
        { v: '', s: STYLES.grandTotal },
        { v: grandTotalPaidHours, s: { ...STYLES.grandTotal, numFmt: '0.00' } },
        { v: grandTotalDaysWorked, s: { ...STYLES.grandTotal, numFmt: '0' } }
      ]);
      
      // Create worksheet from styled data
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Employee Name
        { wch: 20 }, // Role
        { wch: 12 }, // Paid Hours
        { wch: 14 }, // Days Worked
      ];
      
      // Set row heights for better spacing
      ws['!rows'] = wsData.map((_, idx) => {
        if (idx === 0) return { hpt: 24 }; // Company name
        if (idx === 1) return { hpt: 20 }; // Report title
        if (jobsiteRows.includes(idx)) return { hpt: 22 }; // Jobsite headers
        if (idx === grandTotalRow) return { hpt: 22 }; // Grand total
        return { hpt: 18 }; // Default
      });
      
      // Apply merges
      ws['!merges'] = merges;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary');
      
      // Generate file
      const filename = `payroll-summary-${format(params.dateRange.start, 'yyyy-MM-dd')}_to_${format(params.dateRange.end, 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast({
        title: 'Excel Export Complete',
        description: `Professional report downloaded: ${filename}`,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error);
      console.error('Excel Export Error:', error);
      
      toast({
        title: 'Export Failed',
        description: 'Unable to generate Excel report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [params, toast]);

  const exportPayrollPDF = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      await generateTimeSummaryPDF({
        data: params.data,
        companyName: params.companyName,
        companyLogo: params.companyLogo,
        companyAddress: params.companyAddress,
        companyPhone: params.companyPhone,
        companyEmail: params.companyEmail,
        periodStart: params.dateRange.start,
        periodEnd: params.dateRange.end,
        timezone: params.timezone,
        filters: params.filters,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('PDF export failed');
      setError(error);
      console.error('PDF Export Error:', error);

      toast({
        title: 'Export Failed',
        description: 'Unable to generate PDF report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [params, toast, generateTimeSummaryPDF, settings]);
  
  return { isExporting, exportPayrollCSV, exportPayrollExcel, exportPayrollPDF, error };
}
