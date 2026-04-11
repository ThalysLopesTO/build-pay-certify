import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface PunchRecord {
  id: string;
  checkIn: string;
  checkOut: string | null;
  breakMinutes: number;
  netMinutes: number;
  jobsiteName: string;
  status: string;
  note: string | null;
  isIncomplete: boolean;
}

export interface DayBreakdown {
  date: string;
  punches: PunchRecord[];
  dayNetMinutes: number;
  dayBreakMinutes: number;
}

export interface EmployeeBreakdown {
  userId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  totalNetMinutes: number;
  totalBreakMinutes: number;
  days: DayBreakdown[];
}

export interface EmployeeHoursResult {
  employees: EmployeeBreakdown[];
  grandTotalNetMinutes: number;
  grandTotalBreakMinutes: number;
  totalDays: number;
  incompleteCount: number;
}

interface UseEmployeeHoursBreakdownOptions {
  companyId: string | undefined;
  startDate: Date | null;
  endDate: Date | null;
  jobsiteId?: string;
  employeeId?: string;
  enabled?: boolean;
}

export const useEmployeeHoursBreakdown = ({
  companyId,
  startDate,
  endDate,
  jobsiteId = 'all',
  employeeId = 'all',
  enabled = true,
}: UseEmployeeHoursBreakdownOptions) => {
  const supabase = getSupabase();

  const query = useQuery({
    queryKey: ['employee-hours-breakdown', companyId, startDate?.toISOString(), endDate?.toISOString(), jobsiteId, employeeId],
    queryFn: async () => {
      if (!companyId || !startDate || !endDate) return { timesheets: [], profiles: new Map(), jobsites: new Map() };

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      let q = supabase
        .from('timesheets')
        .select('id, user_id, check_in_time, check_out_time, break_minutes, jobsite_id, work_note, status')
        .eq('company_id', companyId)
        .not('check_in_time', 'is', null)
        .gte('check_in_time', start.toISOString())
        .lte('check_in_time', end.toISOString());

      if (jobsiteId !== 'all') q = q.eq('jobsite_id', jobsiteId);
      if (employeeId !== 'all') q = q.eq('user_id', employeeId);

      const { data: timesheets, error } = await q.order('check_in_time', { ascending: true }).limit(1000);
      if (error) throw error;

      // Collect unique user_ids and jobsite_ids
      const userIds = [...new Set((timesheets || []).map(t => t.user_id))];
      const jobsiteIds = [...new Set((timesheets || []).filter(t => t.jobsite_id).map(t => t.jobsite_id!))];

      // Fetch profiles and jobsites in parallel
      const [profilesRes, jobsitesRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from('user_profiles').select('user_id, first_name, last_name, photo_url').in('user_id', userIds)
          : Promise.resolve({ data: [], error: null }),
        jobsiteIds.length > 0
          ? supabase.from('jobsites').select('id, name').in('id', jobsiteIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const profiles = new Map<string, { first_name: string; last_name: string; photo_url: string | null }>();
      (profilesRes.data || []).forEach(p => profiles.set(p.user_id, p));

      const jobsites = new Map<string, string>();
      (jobsitesRes.data || []).forEach(j => jobsites.set(j.id, j.name));

      return { timesheets: timesheets || [], profiles, jobsites };
    },
    enabled: !!companyId && !!startDate && !!endDate && enabled,
    staleTime: 60 * 1000,
  });

  const result = useMemo((): EmployeeHoursResult => {
    const { timesheets = [], profiles = new Map(), jobsites = new Map() } = query.data || {};

    let incompleteCount = 0;

    // Group by employee
    const employeeMap = new Map<string, {
      punches: Array<typeof timesheets[number]>;
    }>();

    for (const t of timesheets) {
      if (!employeeMap.has(t.user_id)) {
        employeeMap.set(t.user_id, { punches: [] });
      }
      employeeMap.get(t.user_id)!.punches.push(t);
    }

    const employees: EmployeeBreakdown[] = [];

    for (const [userId, { punches }] of employeeMap) {
      const profile = profiles.get(userId);

      // Group by day
      const dayMap = new Map<string, PunchRecord[]>();

      for (const p of punches) {
        const isIncomplete = !p.check_out_time;
        if (isIncomplete) incompleteCount++;

        const dayKey = format(new Date(p.check_in_time!), 'yyyy-MM-dd');
        const breakMins = p.break_minutes || 0;
        const durationMs = isIncomplete ? 0 : new Date(p.check_out_time!).getTime() - new Date(p.check_in_time!).getTime();
        const grossMinutes = durationMs / (1000 * 60);
        const netMinutes = isIncomplete ? 0 : Math.max(0, grossMinutes - breakMins);

        const record: PunchRecord = {
          id: p.id,
          checkIn: p.check_in_time!,
          checkOut: p.check_out_time,
          breakMinutes: breakMins,
          netMinutes,
          jobsiteName: p.jobsite_id ? (jobsites.get(p.jobsite_id) || 'Unknown') : '—',
          status: p.status || '',
          note: p.work_note,
          isIncomplete,
        };

        if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
        dayMap.get(dayKey)!.push(record);
      }

      const days: DayBreakdown[] = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, recs]) => ({
          date,
          punches: recs,
          dayNetMinutes: recs.reduce((s, r) => s + (r.isIncomplete ? 0 : r.netMinutes), 0),
          dayBreakMinutes: recs.reduce((s, r) => s + (r.isIncomplete ? 0 : r.breakMinutes), 0),
        }));

      const totalNetMinutes = days.reduce((s, d) => s + d.dayNetMinutes, 0);
      const totalBreakMinutes = days.reduce((s, d) => s + d.dayBreakMinutes, 0);

      employees.push({
        userId,
        firstName: profile?.first_name || 'Unknown',
        lastName: profile?.last_name || '',
        photoUrl: profile?.photo_url || null,
        totalNetMinutes,
        totalBreakMinutes,
        days,
      });
    }

    // Sort employees alphabetically
    employees.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

    const grandTotalNetMinutes = employees.reduce((s, e) => s + e.totalNetMinutes, 0);
    const grandTotalBreakMinutes = employees.reduce((s, e) => s + e.totalBreakMinutes, 0);
    const allDayKeys = new Set<string>();
    employees.forEach(e => e.days.forEach(d => allDayKeys.add(d.date)));

    return {
      employees,
      grandTotalNetMinutes,
      grandTotalBreakMinutes,
      totalDays: allDayKeys.size,
      incompleteCount,
    };
  }, [query.data]);

  return {
    ...result,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
