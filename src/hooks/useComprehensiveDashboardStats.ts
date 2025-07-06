import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useComprehensiveDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comprehensive-dashboard-stats', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      console.log('📊 Fetching comprehensive dashboard stats for company:', user.companyId);

      // Current month dates
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Today dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Dates for various calculations
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
      
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // FINANCIAL QUERIES
      
      // 1. Total Payroll This Month (from weekly_timesheets)
      const { data: payrollData, error: payrollError } = await supabase
        .from('weekly_timesheets')
        .select('gross_pay')
        .eq('company_id', user.companyId)
        .eq('status', 'approved')
        .gte('week_ending', currentMonth.toISOString().split('T')[0])
        .lt('week_ending', nextMonth.toISOString().split('T')[0]);

      const totalPayroll = payrollData?.reduce((sum, record) => sum + (record.gross_pay || 0), 0) || 0;

      // 2. Total Expenses This Month
      const { data: expensesData, error: expensesError } = await supabase
        .from('bills_expenses')
        .select('amount')
        .eq('company_id', user.companyId)
        .gte('expense_date', currentMonth.toISOString().split('T')[0])
        .lt('expense_date', nextMonth.toISOString().split('T')[0]);

      const totalExpenses = expensesData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

      // 3. Pending Invoices
      const { data: pendingInvoicesData, error: pendingInvoicesError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('company_id', user.companyId)
        .eq('status', 'pending');

      const pendingInvoicesCount = pendingInvoicesData?.length || 0;
      const pendingInvoicesAmount = pendingInvoicesData?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0;

      // 4. Total Invoices Paid This Month
      const { data: paidInvoicesData, error: paidInvoicesError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('company_id', user.companyId)
        .eq('status', 'paid')
        .gte('updated_at', currentMonth.toISOString())
        .lt('updated_at', nextMonth.toISOString());

      const totalInvoicesPaid = paidInvoicesData?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0;

      // OPERATIONAL QUERIES

      // 5. Active Jobsites
      const { count: activeJobsitesCount, error: jobsitesError } = await supabase
        .from('jobsites')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId);

      // 6. Jobsites Near Deadline (14 days)
      const { count: jobsitesNearDeadlineCount, error: nearDeadlineError } = await supabase
        .from('jobsites')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .not('due_date', 'is', null)
        .lte('due_date', fourteenDaysFromNow.toISOString().split('T')[0])
        .gte('due_date', today.toISOString().split('T')[0]);

      // 7. Punch-ins Today
      const { count: punchInsToday, error: punchInsError } = await supabase
        .from('timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .gte('check_in_time', today.toISOString())
        .lt('check_in_time', tomorrow.toISOString());

      // 8. Live Employees Clocked-in (no check_out_time today)
      const { count: liveEmployeesCount, error: liveEmployeesError } = await supabase
        .from('timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .gte('check_in_time', today.toISOString())
        .is('check_out_time', null);

      // ALERTS QUERIES

      // 9. Certificates Expiring Soon (7 days)
      const { count: certificatesExpiringCount, error: certificatesError } = await supabase
        .from('employee_certificates')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .lte('expiry_date', sevenDaysFromNow.toISOString().split('T')[0])
        .gte('expiry_date', today.toISOString().split('T')[0]);

      // 10. Invoices Overdue (30+ days)
      const { count: overdueInvoicesCount, error: overdueInvoicesError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('status', 'pending')
        .lte('due_date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Log any errors but don't throw to prevent dashboard from breaking
      const errors = [
        payrollError, expensesError, pendingInvoicesError, paidInvoicesError,
        jobsitesError, nearDeadlineError, punchInsError, liveEmployeesError,
        certificatesError, overdueInvoicesError
      ].filter(Boolean);

      if (errors.length > 0) {
        console.warn('Some dashboard queries had errors:', errors);
      }

      const stats = {
        // Financial
        totalPayroll,
        totalExpenses,
        pendingInvoicesCount,
        pendingInvoicesAmount,
        totalInvoicesPaid,
        
        // Operational
        activeJobsitesCount: activeJobsitesCount || 0,
        jobsitesNearDeadlineCount: jobsitesNearDeadlineCount || 0,
        punchInsToday: punchInsToday || 0,
        liveEmployeesCount: liveEmployeesCount || 0,
        
        // Alerts
        certificatesExpiringCount: certificatesExpiringCount || 0,
        overdueInvoicesCount: overdueInvoicesCount || 0,
      };

      console.log('✅ Comprehensive dashboard stats:', stats);
      return stats;
    },
    enabled: !!user?.companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for live data)
    refetchOnWindowFocus: true,
  });
};