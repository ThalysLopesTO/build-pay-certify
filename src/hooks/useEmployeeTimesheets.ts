
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TimesheetFilters {
  employeeName?: string;
  weekEndingDate?: string;
  status?: string;
}

export const useEmployeeTimesheets = (filters: TimesheetFilters = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-timesheets', user?.companyId, filters],
    queryFn: async () => {
      if (!user?.companyId) return [];

      let query = supabase
        .from('timesheets')
        .select(`
          *,
          jobsites(name)
        `)
        .eq('company_id', user.companyId)
        .order('check_in_time', { ascending: false });

      // Apply filters if provided
      if (filters.employeeName) {
        // This would need to be implemented based on your specific filtering needs
      }

      if (filters.weekEndingDate) {
        // This would need to be implemented based on your specific filtering needs
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: timesheets, error } = await query;

      if (error) {
        console.error('Error fetching employee timesheets:', error);
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

      // Transform the data to include employee name and calculate hours
      return timesheets.map(timesheet => {
        const profile = profileMap.get(timesheet.user_id);
        const hoursWorked = timesheet.check_in_time && timesheet.check_out_time 
          ? (new Date(timesheet.check_out_time).getTime() - new Date(timesheet.check_in_time).getTime()) / (1000 * 60 * 60)
          : 0;

        return {
          ...timesheet,
          employee_name: profile 
            ? `${profile.first_name} ${profile.last_name}`
            : 'Unknown Employee',
          jobsite_name: timesheet.jobsites?.name || 'Unknown Jobsite',
          hours_worked: hoursWorked
        };
      });
    },
    enabled: !!user?.companyId,
  });
};
