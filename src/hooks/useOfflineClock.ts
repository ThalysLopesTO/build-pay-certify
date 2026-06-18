import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveClockSession, ActiveClockSession } from './useActiveClockSession';
import {
  getClockQueue,
  pendingClockSession,
  subscribeClockQueue,
} from '@/lib/offline/clockQueue';
import { flushClockQueue } from '@/lib/offline/flushClockQueue';

export interface ClockSessionState {
  session: (ActiveClockSession & { pending: boolean }) | null;
  isClockedIn: boolean;
  /** True when the active session is a not-yet-synced offline clock-in. */
  isPending: boolean;
}

/**
 * Single source of truth for "am I clocked in?" — merges the server's open
 * timesheet with any queued offline clock-in so the UI (status bar, Time Clock)
 * works the same online or offline. The server session always wins once synced.
 */
export const useClockSession = (): ClockSessionState => {
  const { data: serverSession } = useActiveClockSession();
  const [pending, setPending] = useState(pendingClockSession);

  useEffect(() => subscribeClockQueue(() => setPending(pendingClockSession())), []);

  if (serverSession?.check_in_time) {
    return { session: { ...serverSession, pending: false }, isClockedIn: true, isPending: false };
  }
  if (pending) {
    return {
      session: {
        id: pending.localId,
        check_in_time: pending.checkInTime,
        check_in_location: pending.location,
        jobsite_id: pending.jobsiteId,
        jobsiteName: pending.jobsiteName,
        pending: true,
      },
      isClockedIn: true,
      isPending: true,
    };
  }
  return { session: null, isClockedIn: false, isPending: false };
};

/**
 * Mounted once (in the employee layout): flushes the offline clock queue when
 * connectivity returns and on startup, and reports offline / pending state for
 * the banner. Don't mount this in more than one place — it would double-flush.
 */
export const useOfflineClock = () => {
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(() => getClockQueue().length);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  const runFlush = useCallback(async () => {
    if (!navigator.onLine || getClockQueue().length === 0) return;
    setIsSyncing(true);
    try {
      const res = await flushClockQueue();
      if (res.synced > 0) {
        queryClient.invalidateQueries({ queryKey: ['active-clock-session'] });
        queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      }
    } finally {
      setIsSyncing(false);
      setPendingCount(getClockQueue().length);
    }
  }, [queryClient]);

  useEffect(() => subscribeClockQueue(() => setPendingCount(getClockQueue().length)), []);

  useEffect(() => {
    const onOnline = () => { setIsOffline(false); void runFlush(); };
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    void runFlush(); // catch anything queued from a previous session
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [runFlush]);

  return { pendingCount, isOffline, isSyncing };
};
