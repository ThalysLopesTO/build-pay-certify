import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface EnhancedDashboardStats {
  // Basic stats
  jobsitesCount: number;
  employeesCount: number;
  timesheetsCount: number;
  invoicesCount: number;
  
  // Enhanced stats
  overdueInvoicesCount: number;
  totalHoursThisWeek: number;
  jobsitesNearCompletion: number;
}

export const useEnhancedDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enhanced-dashboard-stats', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        console.error('❌ No company ID available for dashboard stats');
        throw new Error('Company ID is required');
      }

      console.log('📊 Fetching enhanced dashboard stats for company:', user.companyId);

      // Fetch basic stats
      // Fetch jobsites count - STRICTLY scoped by company_id
      const { count: jobsitesCount, error: jobsitesError } = await supabase
        .from('jobsites')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId);

      if (jobsitesError) {
        console.error('Error fetching jobsites count:', jobsitesError);
        throw jobsitesError;
      }

      // Fetch employees count - STRICTLY scoped by company_id
      const { count: employeesCount, error: employeesError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
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

      // Fetch invoices from current month - STRICTLY scoped by company_id
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const { count: invoicesCount, error: invoicesError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .gte('created_at', currentMonth.toISOString());

      if (invoicesError) {
        console.error('Error fetching invoices count:', invoicesError);
        throw invoicesError;
      }

      // ENHANCED STATS
      
      // 1. Overdue Invoices - STRICTLY scoped by company_id
      const today = new Date().toISOString();
      const { count: overdueInvoicesCount, error: overdueError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .eq('status', 'pending')
        .lt('due_date', today);

      if (overdueError) {
        console.error('Error fetching overdue invoices count:', overdueError);
        throw overdueError;
      }

      // 2. Total Hours This Week - STRICTLY scoped by company_id
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { data: timesheets, error: hoursError } = await supabase
        .from('timesheets')
        .select('check_in_time, check_out_time')
        .eq('company_id', user.companyId)
        .gte('check_in_time', startOfWeek.toISOString())
        .not('check_out_time', 'is', null);

      if (hoursError) {
        console.error('Error fetching total hours:', hoursError);
        throw hoursError;
      }

      // Calculate total hours
      const totalHoursThisWeek = timesheets?.reduce((total, timesheet) => {
        if (timesheet.check_in_time && timesheet.check_out_time) {
          const checkIn = new Date(timesheet.check_in_time);
          const checkOut = new Date(timesheet.check_out_time);
          const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          return total + hoursWorked;
        }
        return total;
      }, 0) || 0;

      // 3. Jobsites Near Completion (Assume we store progress in jobsite_tasks or calculate it)
      // This is a placeholder implementation - adjust based on actual data structure
      const { data: nearCompletionJobsites, error: nearCompletionError } = await supabase
        .from('jobsites')
        .select('id')
        .eq('company_id', user.companyId)
        .eq('status', 'active');

      let jobsitesNearCompletion = 0;

      if (nearCompletionError) {
        console.error('Error fetching near completion jobsites:', nearCompletionError);
        throw nearCompletionError;
      } else {
        // For each active jobsite, check if it's near completion
        // This is a simplification - in a real app, you'd have a more accurate way to track progress
        for (const jobsite of nearCompletionJobsites || []) {
          const { count: totalTasks } = await supabase
            .from('jobsite_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('jobsite_id', jobsite.id);
            
          const { count: completedTasks } = await supabase
            .from('jobsite_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('jobsite_id', jobsite.id)
            .eq('status', 'completed');
            
          if (totalTasks && completedTasks) {
            const progressPercent = (completedTasks / totalTasks) * 100;
            if (progressPercent >= 80) {
              jobsitesNearCompletion++;
            }
          }
        }
      }

      const stats: EnhancedDashboardStats = {
        jobsitesCount: jobsitesCount || 0,
        employeesCount: employeesCount || 0,
        timesheetsCount: timesheetsCount || 0,
        invoicesCount: invoicesCount || 0,
        overdueInvoicesCount: overdueInvoicesCount || 0,
        totalHoursThisWeek: Math.round(totalHoursThisWeek * 10) / 10, // Round to 1 decimal place
        jobsitesNearCompletion: jobsitesNearCompletion,
      };

      console.log('✅ Enhanced dashboard stats for company', user.companyId, ':', stats);
      return stats;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};