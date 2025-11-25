import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { JobsiteSummaryWithRules } from './useTimeSummaryDataWithRules';

interface ExportParams {
  companyId: string;
  companyName: string;
  dateRange: { start: Date; end: Date };
  jobsiteFilter?: string[];
  employeeFilter?: string[];
  data: JobsiteSummaryWithRules[];
}

interface ExportResult {
  isExporting: boolean;
  exportPayrollCSV: () => Promise<void>;
  error: Error | null;
}

export function useTimeSummaryExport(params: ExportParams): ExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const exportPayrollCSV = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const rows: string[] = [];
      
      // Header metadata
      rows.push(`Company Name,${params.companyName}`);
      rows.push('Report Type,Payroll Summary');
      rows.push(`Period Start,${format(params.dateRange.start, 'yyyy-MM-dd')}`);
      rows.push(`Period End,${format(params.dateRange.end, 'yyyy-MM-dd')}`);
      rows.push(`Generated,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
      rows.push(`Timezone,${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      rows.push(''); // Empty row
      
      // Column headers
      rows.push('Employee Name,Employee Role,Jobsite(s),Period Start,Period End,Total Raw Hours,Total Paid Hours,Days Worked,Punch Count,Issue Count');
      
      // Aggregate by employee across all jobsites
      const employeeMap = new Map<string, {
        name: string;
        role: string;
        jobsites: Set<string>;
        rawHours: number;
        paidHours: number;
        daysWorked: number;
        punchCount: number;
        issueCount: number;
      }>();
      
      params.data.forEach(jobsite => {
        jobsite.employees.forEach(employee => {
          const key = employee.employee_id;
          const existing = employeeMap.get(key);
          
          if (existing) {
            existing.jobsites.add(jobsite.jobsite_name);
            existing.rawHours += isNaN(employee.total_raw_hours) ? 0 : employee.total_raw_hours;
            existing.paidHours += isNaN(employee.total_paid_hours) ? 0 : employee.total_paid_hours;
            existing.daysWorked += employee.days_worked || 0;
            existing.punchCount += employee.total_punches || 0;
            existing.issueCount += employee.issue_count || 0;
          } else {
            employeeMap.set(key, {
              name: employee.employee_name,
              role: employee.employee_position || employee.employee_trade || employee.employee_role || 'Employee',
              jobsites: new Set([jobsite.jobsite_name]),
              rawHours: isNaN(employee.total_raw_hours) ? 0 : employee.total_raw_hours,
              paidHours: isNaN(employee.total_paid_hours) ? 0 : employee.total_paid_hours,
              daysWorked: employee.days_worked || 0,
              punchCount: employee.total_punches || 0,
              issueCount: employee.issue_count || 0,
            });
          }
        });
      });
      
      // Sort by employee name
      const employees = Array.from(employeeMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      // Totals
      let totalRawHours = 0;
      let totalPaidHours = 0;
      let totalDays = 0;
      let totalPunches = 0;
      let totalIssues = 0;
      
      // Add employee rows
      employees.forEach(emp => {
        const jobsitesStr = Array.from(emp.jobsites).join(', ');
        rows.push(
          `"${emp.name}","${emp.role}","${jobsitesStr}",${format(params.dateRange.start, 'yyyy-MM-dd')},${format(params.dateRange.end, 'yyyy-MM-dd')},${emp.rawHours.toFixed(2)},${emp.paidHours.toFixed(2)},${emp.daysWorked},${emp.punchCount},${emp.issueCount}`
        );
        
        totalRawHours += emp.rawHours;
        totalPaidHours += emp.paidHours;
        totalDays += emp.daysWorked;
        totalPunches += emp.punchCount;
        totalIssues += emp.issueCount;
      });
      
      // Totals row
      rows.push('');
      rows.push(
        `TOTALS,,,,,${totalRawHours.toFixed(2)},${totalPaidHours.toFixed(2)},${totalDays},${totalPunches},${totalIssues}`
      );
      
      // Download
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `stackbuild-payroll-${format(params.dateRange.start, 'yyyy-MM-dd')}_to_${format(params.dateRange.end, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Payroll report downloaded successfully.',
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
  
  return { isExporting, exportPayrollCSV, error };
}
