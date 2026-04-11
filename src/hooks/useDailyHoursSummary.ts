import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DailyTotal {
  date: string;
  totalMinutes: number;
  breakMinutes: number;
  punchCount: number;
}

interface DailyHoursSummaryResult {
  dailyTotals: DailyTotal[];
  totalDays: number;
  totalMinutes: number;
  totalBreakMinutes: number;
  avgMinutesPerDay: number;
  skippedCount: number;
}

interface UseDailyHoursSummaryOptions {
  companyId: string | undefined;
  startDate: Date | null;
  endDate: Date | null;
  jobsiteId?: string;
  employeeId?: string;
  enabled?: boolean;
}

export const formatDurationFromMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

export const useDailyHoursSummary = ({
  companyId,
  startDate,
  endDate,
  jobsiteId = 'all',
  employeeId = 'all',
  enabled = true,
}: UseDailyHoursSummaryOptions) => {
  const supabase = getSupabase();

  const query = useQuery({
    queryKey: ['daily-hours-summary', companyId, startDate?.toISOString(), endDate?.toISOString(), jobsiteId, employeeId],
    queryFn: async () => {
      if (!companyId || !startDate || !endDate) return [];

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      let q = supabase
        .from('timesheets')
        .select('check_in_time, check_out_time, break_minutes')
        .eq('company_id', companyId)
        .not('check_in_time', 'is', null)
        .not('check_out_time', 'is', null)
        .gte('check_in_time', start.toISOString())
        .lte('check_in_time', end.toISOString());

      if (jobsiteId !== 'all') {
        q = q.eq('jobsite_id', jobsiteId);
      }
      if (employeeId !== 'all') {
        q = q.eq('user_id', employeeId);
      }

      const { data, error } = await q.order('check_in_time', { ascending: true }).limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !!startDate && !!endDate && enabled,
    staleTime: 60 * 1000,
  });

  const summary = useMemo((): DailyHoursSummaryResult => {
    const records = query.data || [];
    const allRecordsCount = records.length;

    const grouped = new Map<string, DailyTotal>();

    for (const record of records) {
      if (!record.check_in_time || !record.check_out_time) continue;

      const dayKey = format(new Date(record.check_in_time), 'yyyy-MM-dd');
      const durationMs = new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime();
      const durationMinutes = durationMs / (1000 * 60);
      const breakMins = record.break_minutes || 0;

      const existing = grouped.get(dayKey);
      if (existing) {
        existing.totalMinutes += durationMinutes;
        existing.breakMinutes += breakMins;
        existing.punchCount += 1;
      } else {
        grouped.set(dayKey, {
          date: dayKey,
          totalMinutes: durationMinutes,
          breakMinutes: breakMins,
          punchCount: 1,
        });
      }
    }

    const dailyTotals = Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    const totalMinutes = dailyTotals.reduce((sum, d) => sum + d.totalMinutes, 0);
    const totalBreakMinutes = dailyTotals.reduce((sum, d) => sum + d.breakMinutes, 0);
    const totalDays = dailyTotals.length;

    return {
      dailyTotals,
      totalDays,
      totalMinutes,
      totalBreakMinutes,
      avgMinutesPerDay: totalDays > 0 ? totalMinutes / totalDays : 0,
      skippedCount: 0, // All incomplete punches are excluded by the query
    };
  }, [query.data]);

  return {
    ...summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
