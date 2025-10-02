import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

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

      // Build query for timesheets within date range
      // Use OR condition to capture timesheets with check_in, check_out, or created_at in range
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
          check_in_location,
          check_out_location,
          location_distance,
          work_note,
          created_at
        `)
        .eq('company_id', user.companyId)
        .or(
          `and(check_in_time.gte.${startOfDay(dateRange.start).toISOString()},check_in_time.lte.${endOfDay(dateRange.end).toISOString()}),` +
          `and(check_out_time.gte.${startOfDay(dateRange.start).toISOString()},check_out_time.lte.${endOfDay(dateRange.end).toISOString()}),` +
          `and(created_at.gte.${startOfDay(dateRange.start).toISOString()},created_at.lte.${endOfDay(dateRange.end).toISOString()})`
        )
        .order('check_in_time', { ascending: false });

      // Apply jobsite filter
      if (jobsiteIds.length > 0) {
        query = query.in('jobsite_id', jobsiteIds);
      }

      // Apply employee filter
      if (employeeIds.length > 0) {
        query = query.in('user_id', employeeIds);
      }

      // Apply status filter
      if (status === 'active') {
        query = query.is('check_out_time', null);
      } else if (status === 'complete') {
        query = query.not('check_out_time', 'is', null);
      }

      const { data: timesheets, error: timesheetsError } = await query;

      if (timesheetsError) {
        console.error('Error fetching timesheets:', timesheetsError);
        throw timesheetsError;
      }

      if (!timesheets || timesheets.length === 0) return [];

      // Get unique user IDs and jobsite IDs
      const userIds = [...new Set(timesheets.map(t => t.user_id))];
      const jobsiteIdsFromData = [...new Set(timesheets.map(t => t.jobsite_id))];

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, photo_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Fetch jobsites
      const { data: jobsites, error: jobsitesError } = await supabase
        .from('jobsites')
        .select('id, name')
        .in('id', jobsiteIdsFromData);

      if (jobsitesError) {
        console.error('Error fetching jobsites:', jobsitesError);
        throw jobsitesError;
      }

      // Create maps for quick lookup
      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) || []
      );
      const jobsiteMap = new Map(
        jobsites?.map(j => [j.id, j]) || []
      );

      // Group timesheets by jobsite and employee
      const jobsiteGroups = new Map<string, Map<string, any[]>>();

      timesheets.forEach(timesheet => {
        const jobsiteId = timesheet.jobsite_id;
        const userId = timesheet.user_id;

        if (!jobsiteGroups.has(jobsiteId)) {
          jobsiteGroups.set(jobsiteId, new Map());
        }

        const jobsiteGroup = jobsiteGroups.get(jobsiteId)!;
        if (!jobsiteGroup.has(userId)) {
          jobsiteGroup.set(userId, []);
        }

        jobsiteGroup.get(userId)!.push(timesheet);
      });

      // Transform into JobsiteSummary format
      const summaries: JobsiteSummary[] = [];

      jobsiteGroups.forEach((employeeMap, jobsiteId) => {
        const jobsite = jobsiteMap.get(jobsiteId);
        const employees: EmployeeSummary[] = [];

        employeeMap.forEach((punches, userId) => {
          const profile = profileMap.get(userId);
          
          // Calculate totals and process daily punches
          let totalHours = 0;
          let hasFlags = false;

          const dailyPunches: DailyPunch[] = punches.map(punch => {
            let hours = 0;
            
            if (punch.check_in_time) {
              if (punch.check_out_time) {
                // Complete punch
                hours = (new Date(punch.check_out_time).getTime() - new Date(punch.check_in_time).getTime()) / (1000 * 60 * 60);
              } else {
                // Active punch - calculate hours up to now but only if within date range
                const now = new Date();
                const checkInDate = new Date(punch.check_in_time);
                if (isWithinInterval(now, { start: dateRange.start, end: dateRange.end })) {
                  hours = (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
                }
              }
            }

            totalHours += hours;

            // Check for flags (missing check-out, location discrepancies, etc.)
            if (!punch.check_out_time && punch.check_in_time) {
              const checkInDate = new Date(punch.check_in_time);
              const now = new Date();
              // Flag if check-in was more than 12 hours ago and still no check-out
              if ((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60) > 12) {
                hasFlags = true;
              }
            }

            return {
              id: punch.id,
              date: punch.check_in_time ? new Date(punch.check_in_time).toISOString().split('T')[0] : '',
              check_in_time: punch.check_in_time,
              check_out_time: punch.check_out_time,
              hours_worked: Number(hours.toFixed(2)),
              status: punch.check_out_time ? 'complete' : 'active',
              notes: punch.work_note || null,
              check_in_location: punch.check_in_location,
              check_out_location: punch.check_out_location,
              location_distance: punch.location_distance
            };
          });

          employees.push({
            employee_id: userId,
            employee_name: profile 
              ? `${profile.first_name} ${profile.last_name}`
              : 'Former Employee',
            employee_photo: profile?.photo_url || null,
            total_hours: Number(totalHours.toFixed(2)),
            total_punches: punches.length,
            has_flags: hasFlags,
            daily_punches: dailyPunches
          });
        });

        // Sort employees by name
        employees.sort((a, b) => a.employee_name.localeCompare(b.employee_name));

        summaries.push({
          jobsite_id: jobsiteId,
          jobsite_name: jobsite?.name || 'Unknown Jobsite',
          employees
        });
      });

      // Sort jobsites by name
      summaries.sort((a, b) => a.jobsite_name.localeCompare(b.jobsite_name));

      return summaries;
    },
    enabled: !!user?.companyId,
  });
};
