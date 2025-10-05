/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { validateTimesheetHours, getCorrectTotalHours } from '@/utils/timesheetDataUtils';

interface TimesheetFilters {
  employeeName?: string;
  weekEndingDate?: string;
  status?: string;
  jobsiteId?: string;
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
        .select(`*,
          jobsite:jobsite_id (
            id,
            name
          )`);
        console.log({filters});
      if (filters.employeeName) {
        query = query.eq('employee_name', filters.employeeName);
      }

      // Apply status filter if provided
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply jobsite filter if provided
      if (filters.jobsiteId) {
        query = query.eq('jobsite_id', filters.jobsiteId);
      }

      const { data: timesheets, error } = await query;

      if (error) {
        console.error('Error fetching weekly timesheets:', error);
        throw error;
      }

      if (!timesheets) return [];

      return timesheets;
    },
    enabled: !!user?.companyId,
  });
};
