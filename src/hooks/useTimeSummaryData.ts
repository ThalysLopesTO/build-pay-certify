import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';

// Helper: turn UI values (objects/strings) into array of UUID strings or null
function toIdArray(raw: any): string[] | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const ids = arr
    .map((x) => {
      if (!x) return null;
      if (typeof x === 'string') return x;        // already an id
      return x.id ?? x.value ?? null;             // common Select shapes
    })
    .filter(Boolean);
  return ids.length ? (ids as string[]) : null;   // null means ALL
}

export interface TimeSummaryFilters {
  dateRange: { start: Date; end: Date };
  jobsiteIds: string[];
  employeeIds: string[];
  status: 'all' | 'active' | 'complete';
}

export interface DailyPunch {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number;
  jobsite_name: string;
  location: string | null;
  status: string;
  timesheet_id?: string;
  // Extended for rules-based calculations
  raw_hours?: number;
  paid_hours?: number;
  break_minutes?: number;
  flags?: string[];
  jobsite_id?: string;
}

export interface EmployeeSummary {
  employee_id: string;
  employee_name: string;
  employee_photo: string | null;
  employee_role: string | null;
  employee_position: string | null;
  employee_trade: string | null;
  total_hours: number;
  total_punches: number;
  has_flags: boolean;
  daily_punches: DailyPunch[];
  // Extended for rules-based calculations
  total_raw_hours?: number;
  total_paid_hours?: number;
  issue_count?: number;
  days_worked?: number;
}

export interface JobsiteSummary {
  jobsite_id: string;
  jobsite_name: string;
  employees: EmployeeSummary[];
}

export const useTimeSummaryData = (filters: TimeSummaryFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      'time-summary',
      user?.companyId,
      format(filters.dateRange.start, 'yyyy-MM-dd'),
      format(filters.dateRange.end, 'yyyy-MM-dd'),
      filters.jobsiteIds,
      filters.employeeIds,
      filters.status
    ],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { dateRange, jobsiteIds, employeeIds, status } = filters;

      // Format dates as YYYY-MM-DD for SQL
      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');

      // Fetch company timezone from settings
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('timezone')
        .eq('company_id', user.companyId)
        .single();

      // Use company timezone, fallback to browser timezone
      const timezone = companySettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Normalize filter values to uuid[] or null (ALL)
      const jobsiteFilter = toIdArray(jobsiteIds.length > 0 ? jobsiteIds : null);
      const employeeFilter = toIdArray(employeeIds.length > 0 ? employeeIds : null);
      const statusFilter = status === 'all' ? null : [status];

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
        p_statuses: statusFilter,
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
          employee_photo: row.employee_photo,
          employee_role: row.employee_role,
          employee_position: row.employee_position,
          employee_trade: row.employee_trade,
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
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds - more aggressive for real-time updates
    gcTime: 300000,
    refetchInterval: 30000, // Auto-refresh every 30 seconds as fallback
  });
};
