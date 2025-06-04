
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

      let query = supabase
        .from('weekly_timesheets')
        .select(`
          *,
          user_profiles!inner (
            first_name,
            last_name,
            user_id
          ),
          jobsites!inner (
            name
          )
        `)
        .eq('company_id', user.companyId)
        .order('week_start_date', { ascending: false });

      // Apply employee name filter
      if (filters.employeeName) {
        // We'll need to fetch all data first, then filter by name since we can't filter by joined table fields directly
        const { data: allData, error } = await query;
        
        if (error) {
          console.error('Error fetching timesheets:', error);
          throw error;
        }

        const filteredData = allData?.filter(timesheet => {
          const employeeName = `${timesheet.user_profiles?.first_name || ''} ${timesheet.user_profiles?.last_name || ''}`.trim();
          return employeeName.toLowerCase().includes(filters.employeeName?.toLowerCase() || '');
        });

        return filteredData?.map(timesheet => ({
          ...timesheet,
          employee_name: `${timesheet.user_profiles?.first_name || ''} ${timesheet.user_profiles?.last_name || ''}`.trim(),
          jobsite_name: timesheet.jobsites?.name || 'Unknown Jobsite'
        })) || [];
      }

      // Apply date filter
      if (filters.weekEndingDate) {
        const weekStart = new Date(filters.weekEndingDate);
        weekStart.setDate(weekStart.getDate() - 6); // Get week start (7 days before)
        query = query.eq('week_start_date', weekStart.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching timesheets:', error);
        throw error;
      }

      console.log('Fetched timesheets:', data);

      return data?.map(timesheet => ({
        ...timesheet,
        employee_name: `${timesheet.user_profiles?.first_name || ''} ${timesheet.user_profiles?.last_name || ''}`.trim(),
        jobsite_name: timesheet.jobsites?.name || 'Unknown Jobsite'
      })) || [];
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
