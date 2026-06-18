import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface ActiveClockSession {
  id: string;
  check_in_time: string | null;
  check_in_location: string | null;
  jobsite_id: string | null;
  jobsiteName: string | null;
}

/**
 * Lightweight "is the employee currently clocked in?" query — the open timesheet
 * for today (no check-out yet) with its jobsite name. Kept separate from the
 * heavy useTimesheets hook so the always-on status bar is cheap; the clock
 * mutations invalidate ['active-clock-session'] so it reacts immediately.
 */
export const useActiveClockSession = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-clock-session', user?.id],
    queryFn: async (): Promise<ActiveClockSession | null> => {
      if (!user?.id) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('timesheets')
        .select('id, check_in_time, check_in_location, jobsite_id, check_out_time, jobsites:jobsite_id(name)')
        .eq('user_id', user.id)
        .gte('check_in_time', today.toISOString())
        .lt('check_in_time', tomorrow.toISOString())
        .is('check_out_time', null)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        check_in_time: data.check_in_time,
        check_in_location: data.check_in_location,
        jobsite_id: data.jobsite_id,
        jobsiteName: (data as any).jobsites?.name ?? null,
      };
    },
    enabled: !!user?.id,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: true,
  });
};

export interface Elapsed {
  hours: number;
  minutes: number;
  seconds: number;
  /** "2h 14m" (or "14m" under an hour) */
  short: string;
  /** "02:14:07" */
  long: string;
  totalSeconds: number;
}

/**
 * Live-ticking elapsed time since an ISO start timestamp. Updates every second;
 * returns null when no start is provided (not clocked in).
 */
export const useElapsedTime = (startIso?: string | null): Elapsed | null => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startIso]);

  if (!startIso) return null;

  const totalSeconds = Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    hours,
    minutes,
    seconds,
    short: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    long: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    totalSeconds,
  };
};
