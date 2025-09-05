import { useMemo } from 'react';
import { format, subMonths, startOfMonth } from 'date-fns';

interface PayrollEntry {
  monthYear: string;
  employeeName: string;
  totalHours: number;
  grossPay: number;
  totalPayWithTax: number;
}

interface MonthlyPayrollData {
  month: string;
  monthYear: string;
  totalAmount: number;
  totalHours: number;
  activeEmployees: number;
}

export const usePayrollAnalytics = (
  payrollEntries: PayrollEntry[],
  taxIncluded: boolean
) => {
  return useMemo(() => {
    if (!payrollEntries || payrollEntries.length === 0) {
      return [];
    }

    // Group entries by month
    const monthlyGroups = payrollEntries.reduce((acc, entry) => {
      const monthKey = entry.monthYear;
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(entry);
      return acc;
    }, {} as Record<string, PayrollEntry[]>);

    // Calculate metrics for each month
    const monthlyData: MonthlyPayrollData[] = Object.entries(monthlyGroups).map(([monthKey, entries]) => {
      const totalAmount = entries.reduce((sum, entry) => {
        return sum + (taxIncluded ? entry.totalPayWithTax : entry.grossPay);
      }, 0);

      const totalHours = entries.reduce((sum, entry) => sum + entry.totalHours, 0);

      const uniqueEmployees = new Set(entries.map(entry => entry.employeeName));
      const activeEmployees = uniqueEmployees.size;

      // Parse monthYear (format: 'yyyy-MM') to create proper month label
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthLabel = format(date, 'MMM \'yy');

      return {
        month: monthLabel,
        monthYear: monthKey,
        totalAmount,
        totalHours,
        activeEmployees,
      };
    });

    // Sort by monthYear (chronological order)
    return monthlyData.sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [payrollEntries, taxIncluded]);
};

// Generate last 12 months for default view when no date filters applied
export const getDefaultMonthRange = () => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(startOfMonth(now), i);
    months.push({
      month: format(date, 'MMM \'yy'),
      monthYear: format(date, 'yyyy-MM'),
      totalAmount: 0,
      totalHours: 0,
      activeEmployees: 0,
    });
  }
  
  return months;
};