import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { queryKeys } from '@/lib/queryKeyFactory';
import { CACHE_STRATEGIES } from '@/lib/optimizedQueryClient';

export interface OptimizedDashboardStats {
  jobsitesCount: number;
  employeesCount: number;
  timesheetsCount: number;
  invoicesCount: number;
  overdueInvoicesCount: number;
  totalHoursThisWeek: number;
  jobsitesNearCompletion: number;
}

export const useOptimizedDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.enhanced(user?.companyId || ''),
    queryFn: async (): Promise<OptimizedDashboardStats> => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      console.log('📊 Fetching optimized dashboard stats for company:', user.companyId);

      // Batch all queries to run in parallel instead of sequentially
      const [
        jobsitesResult,
        employeesResult,
        timesheetsResult,
        invoicesResult,
        overdueInvoicesResult,
        hoursResult,
        nearCompletionResult
      ] = await Promise.all([
        // Active jobsites count
        supabase
          .from('jobsites')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .eq('status', 'active'),

        // Active employees count
        supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .eq('is_active', true)
          .in('role', ['employee', 'foreman', 'admin']),

        // Recent timesheets count
        supabase
          .from('weekly_timesheets')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

        // Pending invoices count
        supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .eq('status', 'pending')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

        // Overdue invoices count
        supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.companyId)
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString()),

        // Total hours this week - optimized query
        (() => {
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          return supabase
            .from('timesheets')
            .select('check_in_time, check_out_time')
            .eq('company_id', user.companyId)
            .gte('check_in_time', startOfWeek.toISOString())
            .not('check_out_time', 'is', null);
        })(),

        // Jobsites near completion - simplified check
        supabase
          .from('jobsites')
          .select('id, due_date')
          .eq('company_id', user.companyId)
          .eq('status', 'active')
          .not('due_date', 'is', null)
      ]);

      // Handle errors
      const errors = [
        jobsitesResult.error,
        employeesResult.error,
        timesheetsResult.error,
        invoicesResult.error,
        overdueInvoicesResult.error,
        hoursResult.error,
        nearCompletionResult.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('Dashboard stats errors:', errors);
        throw errors[0];
      }

      // Calculate total hours efficiently
      const totalHoursThisWeek = hoursResult.data?.reduce((total, timesheet) => {
        if (timesheet.check_in_time && timesheet.check_out_time) {
          const hours = (new Date(timesheet.check_out_time).getTime() - 
                        new Date(timesheet.check_in_time).getTime()) / (1000 * 60 * 60);
          return total + hours;
        }
        return total;
      }, 0) || 0;

      // Simple completion check - jobsites due within 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const jobsitesNearCompletion = nearCompletionResult.data?.filter(jobsite => 
        jobsite.due_date && new Date(jobsite.due_date) <= thirtyDaysFromNow
      ).length || 0;

      const stats: OptimizedDashboardStats = {
        jobsitesCount: jobsitesResult.count || 0,
        employeesCount: employeesResult.count || 0,
        timesheetsCount: timesheetsResult.count || 0,
        invoicesCount: invoicesResult.count || 0,
        overdueInvoicesCount: overdueInvoicesResult.count || 0,
        totalHoursThisWeek: Math.round(totalHoursThisWeek * 10) / 10,
        jobsitesNearCompletion,
      };

      console.log('✅ Optimized dashboard stats:', stats);
      return stats;
    },
    enabled: !!user?.companyId,
    ...CACHE_STRATEGIES.DYNAMIC,
    // Background refetch to keep data fresh without blocking UI
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};
