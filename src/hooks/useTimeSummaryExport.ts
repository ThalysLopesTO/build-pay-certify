import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { JobsiteSummaryWithRules } from './useTimeSummaryDataWithRules';
import { useTimeSummaryPDF } from './useTimeSummaryPDF';
import { useCompanySettings } from './useCompanySettings';

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
  exportPayrollPDF: () => Promise<void>;
  error: Error | null;
}

interface PayrollDataRow {
  employeeName: string;
  employeeRole: string;
  jobsiteName: string;
  periodStart: string;
  periodEnd: string;
  totalRawHours: number;
  totalPaidHours: number;
  daysWorked: number;
  punchCount: number;
  issueCount: number;
}

/**
 * Escapes and quotes a CSV field if necessary
 */
function escapeCsvField(value: string | number): string {
  const str = String(value);
  
  // If the field contains comma, quote, or newline, wrap it in quotes and escape internal quotes
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
      const periodStartStr = format(params.dateRange.start, 'yyyy-MM-dd');
      const periodEndStr = format(params.dateRange.end, 'yyyy-MM-dd');
      const generatedAtStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const timezoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // ========== HEADER SECTION (Rows 1-7) ==========
      rows.push(arrayToCsvRow(['Company', params.companyName]));
      rows.push(arrayToCsvRow(['Report Type', 'Payroll Summary']));
      rows.push(arrayToCsvRow(['Period Start', periodStartStr]));
      rows.push(arrayToCsvRow(['Period End', periodEndStr]));
      rows.push(arrayToCsvRow(['Generated At', generatedAtStr]));
      rows.push(arrayToCsvRow(['Timezone', timezoneStr]));
      rows.push(''); // Blank row
      
      // ========== MAIN TABLE HEADER (Row 8) ==========
      const headerColumns = [
        'Employee Name',
        'Employee Role',
        'Jobsite',
        'Period Start',
        'Period End',
        'Total Raw Hours',
        'Total Paid Hours',
        'Days Worked',
        'Punch Count',
        'Issue Count'
      ];
      rows.push(arrayToCsvRow(headerColumns));
      
      // ========== BUILD DATA ROWS ==========
      const dataRows: PayrollDataRow[] = [];
      
      params.data.forEach(jobsite => {
        jobsite.employees.forEach(employee => {
          // Determine the best role label
          const role = employee.employee_position || 
                      employee.employee_trade || 
                      employee.employee_role || 
                      'Employee';
          
          dataRows.push({
            employeeName: employee.employee_name,
            employeeRole: role,
            jobsiteName: jobsite.jobsite_name,
            periodStart: periodStartStr,
            periodEnd: periodEndStr,
            totalRawHours: safeNumber(employee.total_raw_hours),
            totalPaidHours: safeNumber(employee.total_paid_hours),
            daysWorked: safeNumber(employee.days_worked),
            punchCount: safeNumber(employee.total_punches),
            issueCount: safeNumber(employee.issue_count),
          });
        });
      });
      
      // ========== SORT DATA ROWS ==========
      // First by jobsite name (ascending), then by employee name (ascending)
      dataRows.sort((a, b) => {
        const jobsiteCompare = a.jobsiteName.localeCompare(b.jobsiteName);
        if (jobsiteCompare !== 0) return jobsiteCompare;
        return a.employeeName.localeCompare(b.employeeName);
      });
      
      // ========== CALCULATE TOTALS ==========
      let totalRawHours = 0;
      let totalPaidHours = 0;
      let totalDaysWorked = 0;
      let totalPunchCount = 0;
      let totalIssueCount = 0;
      
      // ========== WRITE DATA ROWS ==========
      dataRows.forEach(row => {
        const rowValues = [
          row.employeeName,
          row.employeeRole,
          row.jobsiteName,
          row.periodStart,
          row.periodEnd,
          row.totalRawHours.toFixed(2),
          row.totalPaidHours.toFixed(2),
          row.daysWorked.toString(),
          row.punchCount.toString(),
          row.issueCount.toString()
        ];
        
        rows.push(arrayToCsvRow(rowValues));
        
        // Accumulate totals
        totalRawHours += row.totalRawHours;
        totalPaidHours += row.totalPaidHours;
        totalDaysWorked += row.daysWorked;
        totalPunchCount += row.punchCount;
        totalIssueCount += row.issueCount;
      });
      
      // ========== TOTALS ROW ==========
      rows.push(''); // Blank row before totals
      
      const totalsRowValues = [
        'TOTALS',
        '', // Empty for Employee Role
        '', // Empty for Jobsite
        '', // Empty for Period Start
        '', // Empty for Period End
        totalRawHours.toFixed(2),
        totalPaidHours.toFixed(2),
        totalDaysWorked.toString(),
        totalPunchCount.toString(),
        totalIssueCount.toString()
      ];
      rows.push(arrayToCsvRow(totalsRowValues));
      
      // ========== DOWNLOAD CSV ==========
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `stackbuild-payroll-${periodStartStr}_to_${periodEndStr}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: `Payroll report downloaded successfully: ${filename}`,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error);
      console.error('CSV Export Error:', error);
      
      toast({
        title: 'Export Failed',
        description: 'Unable to generate report. Please try again or contact support.',
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
        description: 'Unable to generate PDF report. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [params, toast, generateTimeSummaryPDF, settings]);
  
  return { isExporting, exportPayrollCSV, exportPayrollPDF, error };
}
