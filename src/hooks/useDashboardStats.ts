
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats-v2', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        console.error('❌ No company ID available for dashboard stats');
        throw new Error('Company ID is required');
      }

      console.log('📊 Fetching dashboard stats for company:', user.companyId);

      // Fetch active jobsites count - STRICTLY scoped by company_id and only active jobsites
      const { count: jobsitesCount, error: jobsitesError } = await supabase
        .from('jobsites')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('status', 'active');

      if (jobsitesError) {
        console.error('Error fetching jobsites count:', jobsitesError);
        throw jobsitesError;
      }

      // Fetch active employees count - STRICTLY scoped by company_id and only active employees
      const { count: employeesCount, error: employeesError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .in('role', ['employee', 'foreman', 'admin']);

      if (employeesError) {
        console.error('Error fetching employees count:', employeesError);
        throw employeesError;
      }

      // Fetch timesheets from last 7 days - STRICTLY scoped by company_id
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: timesheetsCount, error: timesheetsError } = await supabase
        .from('weekly_timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (timesheetsError) {
        console.error('Error fetching timesheets count:', timesheetsError);
        throw timesheetsError;
      }

      // Fetch pending invoices from current month - STRICTLY scoped by company_id
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const { count: invoicesCount, error: invoicesError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('status', 'pending')
        .gte('created_at', currentMonth.toISOString());

      if (invoicesError) {
        console.error('Error fetching invoices count:', invoicesError);
        throw invoicesError;
      }

      const stats = {
        jobsitesCount: jobsitesCount || 0,
        employeesCount: employeesCount || 0,
        timesheetsCount: timesheetsCount || 0,
        invoicesCount: invoicesCount || 0,
      };

      console.log('✅ Dashboard stats for company', user.companyId, ':', stats);
      return stats;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
