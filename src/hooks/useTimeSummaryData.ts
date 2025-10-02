import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';

export interface TimeSummaryFilters {
  dateRange: { start: Date; end: Date };
  jobsiteIds: string[];
  employeeIds: string[];
  status: 'all' | 'active' | 'complete';
}

export interface DailyPunch {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number;
  status: string;
  notes: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  location_distance?: number | null;
}

export interface EmployeeSummary {
  employee_id: string;
  employee_name: string;
  employee_photo: string | null;
  total_hours: number;
  total_punches: number;
  has_flags: boolean;
  daily_punches: DailyPunch[];
}

export interface JobsiteSummary {
  jobsite_id: string;
  jobsite_name: string;
  employees: EmployeeSummary[];
}

export const useTimeSummaryData = (filters: TimeSummaryFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['time-summary', user?.companyId, filters],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { dateRange, jobsiteIds, employeeIds, status } = filters;

      // Format dates as YYYY-MM-DD for SQL
      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');

      // Get browser timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Treat empty filters as null (meaning ALL)
      const jobsiteFilter = jobsiteIds.length > 0 ? jobsiteIds : null;
      const employeeFilter = employeeIds.length > 0 ? employeeIds : null;
      const statusFilter = status === 'all' ? null : status;

      console.log('Time Summary RPC Call:', {
        companyId: user.companyId,
        startDate,
        endDate,
        timezone,
        jobsiteFilter,
        employeeFilter,
        statusFilter,
      });

      // Call the RPC function to get headers (jobsite × employee totals)
      const { data: headers, error } = await supabase.rpc('rpc_time_summary_headers', {
        p_company_id: user.companyId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_jobsite_ids: jobsiteFilter,
        p_employee_ids: employeeFilter,
        p_status: statusFilter,
        p_tz: timezone,
      });

      if (error) {
        console.error('Error fetching time summary headers:', error);
        throw error;
      }

      if (!headers || headers.length === 0) {
        console.log('No data returned from RPC');
        return [];
      }

      console.log(`Received ${headers.length} header rows from RPC`);

      // Group by jobsite
      const jobsiteMap = new Map<string, EmployeeSummary[]>();
      const jobsiteNames = new Map<string, string>();

      headers.forEach((row: any) => {
        if (!jobsiteMap.has(row.jobsite_id)) {
          jobsiteMap.set(row.jobsite_id, []);
          jobsiteNames.set(row.jobsite_id, row.jobsite_name);
        }

        jobsiteMap.get(row.jobsite_id)!.push({
          employee_id: row.employee_id,
          employee_name: row.employee_name,
          employee_photo: null, // Not included in RPC for performance
          total_hours: Number((row.total_minutes / 60).toFixed(2)), // Convert minutes to hours
          total_punches: row.total_punches,
          has_flags: row.has_flags,
          daily_punches: [], // Will be loaded on demand
        });
      });

      // Convert to summary format
      const summaries: JobsiteSummary[] = [];

      jobsiteMap.forEach((employees, jobsiteId) => {
        summaries.push({
          jobsite_id: jobsiteId,
          jobsite_name: jobsiteNames.get(jobsiteId) || 'Unknown Jobsite',
          employees,
        });
      });

      // Sort by jobsite name
      summaries.sort((a, b) => a.jobsite_name.localeCompare(b.jobsite_name));

      console.log(`Returning ${summaries.length} jobsite summaries`);

      return summaries;
    },
    enabled: !!user?.companyId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    gcTime: 300000,
  });
};
