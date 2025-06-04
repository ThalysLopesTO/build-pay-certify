
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

      // First, let's get the timesheets with a simpler query
      let query = supabase
        .from('weekly_timesheets')
        .select('*')
        .eq('company_id', user.companyId)
        .order('week_start_date', { ascending: false });

      // Apply date filter first if provided
      if (filters.weekEndingDate) {
        const weekStart = new Date(filters.weekEndingDate);
        weekStart.setDate(weekStart.getDate() - 6); // Get week start (7 days before)
        query = query.eq('week_start_date', weekStart.toISOString().split('T')[0]);
      }

      const { data: timesheets, error } = await query;

      if (error) {
        console.error('Error fetching timesheets:', error);
        throw error;
      }

      if (!timesheets || timesheets.length === 0) {
        return [];
      }

      // Get all unique user IDs and jobsite IDs
      const userIds = [...new Set(timesheets.map(t => t.submitted_by))];
      const jobsiteIds = [...new Set(timesheets.map(t => t.jobsite_id))];

      // Fetch user profiles
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (userError) {
        console.error('Error fetching user profiles:', userError);
        throw userError;
      }

      // Fetch jobsites
      const { data: jobsites, error: jobsiteError } = await supabase
        .from('jobsites')
        .select('id, name')
        .in('id', jobsiteIds);

      if (jobsiteError) {
        console.error('Error fetching jobsites:', jobsiteError);
        throw jobsiteError;
      }

      // Create lookup maps
      const userMap = new Map(userProfiles?.map(u => [u.user_id, u]) || []);
      const jobsiteMap = new Map(jobsites?.map(j => [j.id, j]) || []);

      // Combine the data
      let enrichedTimesheets = timesheets.map(timesheet => {
        const userProfile = userMap.get(timesheet.submitted_by);
        const jobsite = jobsiteMap.get(timesheet.jobsite_id);
        
        return {
          ...timesheet,
          user_profiles: userProfile,
          jobsites: jobsite,
          employee_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Unknown Employee',
          jobsite_name: jobsite?.name || 'Unknown Jobsite'
        };
      });

      // Apply employee name filter if provided
      if (filters.employeeName) {
        enrichedTimesheets = enrichedTimesheets.filter(timesheet => {
          return timesheet.employee_name.toLowerCase().includes(filters.employeeName?.toLowerCase() || '');
        });
      }

      console.log('Fetched and enriched timesheets:', enrichedTimesheets);
      return enrichedTimesheets;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
