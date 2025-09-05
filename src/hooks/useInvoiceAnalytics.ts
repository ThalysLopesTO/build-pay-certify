import { useMemo } from 'react';
import { Invoice } from '@/components/admin/types/invoice';

export interface MonthlyData {
  month: string;
  paid: number;
  issued: number;
  pending: number;
  overdue: number;
}

export const useInvoiceAnalytics = (
  invoices: Invoice[],
  dateFrom?: string,
  dateTo?: string
) => {
  const monthlyData = useMemo(() => {
    if (!invoices.length) return [];

    // Determine date range - default to last 12 months if no filters
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const startDate = dateFrom ? new Date(dateFrom) : defaultStartDate;
    const endDate = dateTo ? new Date(dateTo) : now;

    // Generate all months in the range
    const months: string[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (current <= endDate) {
      months.push(current.toISOString().substring(0, 7)); // YYYY-MM format
      current.setMonth(current.getMonth() + 1);
    }

    // Initialize data structure
    const monthlyMap = new Map<string, MonthlyData>();
    months.forEach(month => {
      monthlyMap.set(month, {
        month,
        paid: 0,
        issued: 0,
        pending: 0,
        overdue: 0
      });
    });

    // Process invoices
    invoices.forEach(invoice => {
      const createdMonth = invoice.created_at.substring(0, 7);
      const dueMonth = invoice.due_date.substring(0, 7);
      const today = new Date().toISOString().substring(0, 10);

      // Issued amount (by creation month)
      if (monthlyMap.has(createdMonth)) {
        const data = monthlyMap.get(createdMonth)!;
        data.issued += invoice.total_amount;
      }

      // Paid amount (use sent_date as proxy for payment month)
      if (invoice.status === 'paid' && invoice.sent_date) {
        const paidMonth = invoice.sent_date.substring(0, 7);
        if (monthlyMap.has(paidMonth)) {
          const data = monthlyMap.get(paidMonth)!;
          data.paid += invoice.total_amount;
        }
      }

      // Pending amount (by due month)
      if (invoice.status === 'pending') {
        if (monthlyMap.has(dueMonth)) {
          const data = monthlyMap.get(dueMonth)!;
          if (invoice.due_date >= today) {
            data.pending += invoice.total_amount;
          } else {
            data.overdue += invoice.total_amount;
          }
        }
      }

      // Overdue amount (past due by due month)
      if (invoice.status !== 'paid' && invoice.due_date < today) {
        if (monthlyMap.has(dueMonth)) {
          const data = monthlyMap.get(dueMonth)!;
          data.overdue += invoice.total_amount;
        }
      }
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [invoices, dateFrom, dateTo]);

  return { monthlyData };
};