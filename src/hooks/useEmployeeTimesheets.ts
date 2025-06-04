
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useEmployeeTimesheets = (filters: { employeeName?: string; weekEndingDate?: string }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-timesheets', user?.companyId, filters],
    queryFn: async () => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      console.log('Fetching employee timesheets for company:', user.companyId);
      console.log('Applied filters:', filters);

      // Start with the main timesheets query
      let timesheetsQuery = supabase
        .from('weekly_timesheets')
        .select('*')
        .eq('company_id', user.companyId)
        .order('week_start_date', { ascending: false });

      // Apply date filter if provided
      if (filters.weekEndingDate) {
        const weekStart = new Date(filters.weekEndingDate);
        weekStart.setDate(weekStart.getDate() - 6); // Get week start (7 days before)
        timesheetsQuery = timesheetsQuery.eq('week_start_date', weekStart.toISOString().split('T')[0]);
      }

      const { data: timesheets, error: timesheetsError } = await timesheetsQuery;

      if (timesheetsError) {
        console.error('Error fetching timesheets:', timesheetsError);
        throw timesheetsError;
      }

      if (!timesheets || timesheets.length === 0) {
        console.log('No timesheets found');
        return [];
      }

      // Get unique user IDs and jobsite IDs from the timesheets
      const userIds = [...new Set(timesheets.map(t => t.submitted_by))];
      const jobsiteIds = [...new Set(timesheets.map(t => t.jobsite_id))];

      // Fetch user profiles for the employees who submitted timesheets
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (userError) {
        console.error('Error fetching user profiles:', userError);
        throw userError;
      }

      // Fetch jobsites for the timesheets
      const { data: jobsites, error: jobsiteError } = await supabase
        .from('jobsites')
        .select('id, name')
        .in('id', jobsiteIds);

      if (jobsiteError) {
        console.error('Error fetching jobsites:', jobsiteError);
        throw jobsiteError;
      }

      // Create lookup maps for efficient data joining
      const userMap = new Map(userProfiles?.map(u => [u.user_id, u]) || []);
      const jobsiteMap = new Map(jobsites?.map(j => [j.id, j]) || []);

      // Enrich timesheets with user and jobsite data
      let enrichedTimesheets = timesheets.map(timesheet => {
        const userProfile = userMap.get(timesheet.submitted_by);
        const jobsite = jobsiteMap.get(timesheet.jobsite_id);
        
        const employeeName = userProfile 
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          : 'Unknown Employee';

        return {
          ...timesheet,
          user_profiles: userProfile,
          jobsites: jobsite,
          employee_name: employeeName,
          jobsite_name: jobsite?.name || 'Unknown Jobsite'
        };
      });

      // Apply employee name filter if provided
      if (filters.employeeName && filters.employeeName.trim() !== '') {
        enrichedTimesheets = enrichedTimesheets.filter(timesheet => {
          return timesheet.employee_name.toLowerCase().includes(filters.employeeName?.toLowerCase() || '');
        });
      }

      console.log('Successfully fetched and enriched timesheets:', enrichedTimesheets.length, 'records');
      return enrichedTimesheets;
    },
    enabled: !!user?.companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes - reduced for better data freshness
    gcTime: 5 * 60 * 1000, // 5 minutes (replaced cacheTime with gcTime)
  });
};
