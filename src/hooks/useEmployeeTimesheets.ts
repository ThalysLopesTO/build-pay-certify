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
          user_profiles!inner(first_name, last_name),
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

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching employee timesheets:', error);
        throw error;
      }

      // Transform the data to include employee name
      return data?.map(timesheet => ({
        ...timesheet,
        employee_name: timesheet.user_profiles 
          ? `${timesheet.user_profiles.first_name} ${timesheet.user_profiles.last_name}`
          : 'Unknown Employee',
        jobsite_name: timesheet.jobsites?.name || 'Unknown Jobsite'
      })) || [];
    },
    enabled: !!user?.companyId,
  });
};
