import { useEffect, useMemo, useState } from 'react';

/**
 * useCountdown
 * Counts down to a target time. Updates every `intervalMs` (default 60s).
 * Returns total milliseconds remaining and a formatted "Xh Ym left" string.
 */
export function useCountdown(targetISO?: string | null, intervalMs: number = 60000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const totalMs = useMemo(() => {
    if (!targetISO) return 0;
    const target = new Date(targetISO).getTime();
    const diff = target - now;
    return diff > 0 ? diff : 0;
  }, [targetISO, now]);

  const formatted = useMemo(() => {
    if (totalMs <= 0) return '0m left';
    const minutes = Math.floor(totalMs / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
  }, [totalMs]);

  return { totalMs, formatted };
}
