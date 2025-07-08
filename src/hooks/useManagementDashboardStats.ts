import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useManagementDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['management-dashboard-stats', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        console.error('❌ No company ID available for management dashboard stats');
        throw new Error('Company ID is required');
      }

      console.log('📊 Fetching management dashboard stats for company:', user.companyId);

      // Get current week start and end
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Fetch pending timesheets count
      const { count: pendingTimesheetsCount, error: timesheetsError } = await supabase
        .from('weekly_timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('status', 'submitted');

      if (timesheetsError) {
        console.error('Error fetching pending timesheets:', timesheetsError);
        throw timesheetsError;
      }

      // Fetch current week payroll total
      const { data: payrollData, error: payrollError } = await supabase
        .from('weekly_timesheets')
        .select('gross_pay')
        .eq('company_id', user.companyId)
        .eq('status', 'approved')
        .gte('week_ending', startOfWeek.toISOString())
        .lte('week_ending', endOfWeek.toISOString());

      if (payrollError) {
        console.error('Error fetching payroll data:', payrollError);
        throw payrollError;
      }

      const currentWeekPayroll = payrollData?.reduce((sum, record) => sum + (record.gross_pay || 0), 0) || 0;

      // Fetch pending bills count
      const { count: pendingBillsCount, error: billsError } = await supabase
        .from('bills_expenses')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('payment_status', 'unpaid');

      if (billsError) {
        console.error('Error fetching pending bills:', billsError);
        throw billsError;
      }

      // Fetch open attention reports count
      const { count: openReportsCount, error: reportsError } = await supabase
        .from('attention_reports')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('status', 'pending');

      if (reportsError) {
        console.error('Error fetching attention reports:', reportsError);
        throw reportsError;
      }

      // Calculate processed timesheets ratio
      const { count: totalTimesheetsCount, error: totalTimesheetsError } = await supabase
        .from('weekly_timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .gte('week_ending', startOfWeek.toISOString())
        .lte('week_ending', endOfWeek.toISOString());

      if (totalTimesheetsError) {
        console.error('Error fetching total timesheets:', totalTimesheetsError);
        throw totalTimesheetsError;
      }

      const { count: approvedTimesheetsCount, error: approvedTimesheetsError } = await supabase
        .from('weekly_timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('status', 'approved')
        .gte('week_ending', startOfWeek.toISOString())
        .lte('week_ending', endOfWeek.toISOString());

      if (approvedTimesheetsError) {
        console.error('Error fetching approved timesheets:', approvedTimesheetsError);
        throw approvedTimesheetsError;
      }

      const stats = {
        pendingTimesheetsCount: pendingTimesheetsCount || 0,
        currentWeekPayroll,
        pendingBillsCount: pendingBillsCount || 0,
        openReportsCount: openReportsCount || 0,
        totalTimesheetsCount: totalTimesheetsCount || 0,
        approvedTimesheetsCount: approvedTimesheetsCount || 0,
      };

      console.log('✅ Management dashboard stats for company', user.companyId, ':', stats);
      return stats;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};