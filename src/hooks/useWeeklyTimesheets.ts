
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TimesheetFilters {
  employeeName?: string;
  weekEndingDate?: string;
  status?: string;
}

export const useWeeklyTimesheets = (filters: TimesheetFilters = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-timesheets', user?.companyId, filters],
    queryFn: async () => {
      if (!user?.companyId) return [];

      // Get all timesheets for the company - these are individual punch records
      let query = supabase
        .from('timesheets')
        .select(`
          id,
          user_id,
          jobsite_id,
          check_in_time,
          check_out_time,
          hours_worked,
          status,
          created_at,
          company_id,
          jobsites(name)
        `)
        .eq('company_id', user.companyId)
        .not('check_in_time', 'is', null)
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: timesheets, error } = await query;

      if (error) {
        console.error('Error fetching timesheets:', error);
        throw error;
      }

      if (!timesheets) return [];

      // Get user profiles separately to avoid relationship issues
      const userIds = [...new Set(timesheets.map(t => t.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        throw profilesError;
      }

      // Create a map of user profiles for quick lookup
      const profileMap = new Map(
        profiles?.map(profile => [profile.user_id, profile]) || []
      );

      // Group timesheets by user and week, then calculate totals
      const weeklyData = new Map<string, any>();

      timesheets.forEach(timesheet => {
        const profile = profileMap.get(timesheet.user_id);
        const checkInDate = new Date(timesheet.check_in_time);
        
        // Calculate week ending date (assuming Sunday is end of week)
        const dayOfWeek = checkInDate.getDay();
        const weekEndingDate = new Date(checkInDate);
        weekEndingDate.setDate(checkInDate.getDate() + (6 - dayOfWeek));
        weekEndingDate.setHours(23, 59, 59, 999);
        
        const weekKey = `${timesheet.user_id}-${weekEndingDate.toISOString().split('T')[0]}`;
        
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            id: `weekly-${weekKey}`,
            user_id: timesheet.user_id,
            employee_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Employee',
            week_ending_date: weekEndingDate.toISOString().split('T')[0],
            total_hours: 0,
            status: 'pending', // Default status for aggregated weekly data
            timesheets: [],
            jobsite_name: timesheet.jobsites?.name || 'Various Jobsites',
            created_at: timesheet.created_at
          });
        }

        const weekData = weeklyData.get(weekKey);
        weekData.total_hours += timesheet.hours_worked || 0;
        weekData.timesheets.push(timesheet);
      });

      // Convert map to array and apply filters
      let result = Array.from(weeklyData.values());

      // Apply employee name filter if provided
      if (filters.employeeName) {
        result = result.filter(item => 
          item.employee_name.toLowerCase().includes(filters.employeeName!.toLowerCase())
        );
      }

      // Apply week ending date filter if provided
      if (filters.weekEndingDate) {
        result = result.filter(item => item.week_ending_date === filters.weekEndingDate);
      }

      return result.sort((a, b) => new Date(b.week_ending_date).getTime() - new Date(a.week_ending_date).getTime());
    },
    enabled: !!user?.companyId,
  });
};
