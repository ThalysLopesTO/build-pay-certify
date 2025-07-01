
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

      // Get weekly timesheets - these are employee submissions
      let query = supabase
        .from('weekly_timesheets')
        .select(`
          id,
          submitted_by,
          company_id,
          jobsite_id,
          week_start_date,
          monday_hours,
          tuesday_hours,
          wednesday_hours,
          thursday_hours,
          friday_hours,
          saturday_hours,
          sunday_hours,
          hourly_rate,
          additional_expense,
          notes,
          status,
          total_hours,
          gross_pay,
          created_at,
          jobsites(name)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      // Apply status filter if provided
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: timesheets, error } = await query;

      if (error) {
        console.error('Error fetching weekly timesheets:', error);
        throw error;
      }

      if (!timesheets) return [];

      // Get user profiles for employee names
      const userIds = [...new Set(timesheets.map(t => t.submitted_by))];
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

      // Transform the data to include employee names and calculated fields
      let result = timesheets.map(timesheet => {
        const profile = profileMap.get(timesheet.submitted_by);
        
        return {
          ...timesheet,
          employee_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Employee',
          jobsite_name: timesheet.jobsites?.name || 'Unknown Jobsite',
          week_ending_date: timesheet.week_start_date, // This will be the week start date from submissions
        };
      });

      // Apply employee name filter if provided
      if (filters.employeeName) {
        result = result.filter(item => 
          item.employee_name.toLowerCase().includes(filters.employeeName!.toLowerCase())
        );
      }

      // Apply week ending date filter if provided
      if (filters.weekEndingDate) {
        result = result.filter(item => item.week_start_date === filters.weekEndingDate);
      }

      return result;
    },
    enabled: !!user?.companyId,
  });
};
