// Offline-first queue for clock-in / clock-out actions. Field crews lose signal
// on jobsites, so these actions are persisted to localStorage and flushed when
// connectivity returns (and across app restarts). Only clock punches go here —
// they carry no file blobs, so localStorage is sufficient.

export interface ClockInAction {
  type: 'clock_in';
  localId: string;
  createdAt: string;
  userId: string;
  companyId: string;
  jobsiteId: string;
  jobsiteName: string | null;
  location: string;
  checkInTime: string; // ISO captured at tap time (the real punch moment)
}

export interface ClockOutAction {
  type: 'clock_out';
  localId: string;
  createdAt: string;
  /** Real server timesheet id, when the matching clock-in was already synced. */
  timesheetId: string | null;
  /** Local clock-in id, when clocking out a still-pending offline clock-in. */
  pendingClockInLocalId: string | null;
  location: string;
  checkOutTime: string; // ISO captured at tap time
  breakMinutes: number;
  workNote?: string;
}

export type ClockAction = ClockInAction | ClockOutAction;

const KEY = 'bpc.offline.clockQueue.v1';
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const subscribeClockQueue = (fn: () => void) => {
  listeners.add(fn);
  // Cross-tab changes
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) fn(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
};

export const getClockQueue = (): ClockAction[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ClockAction[]) : [];
  } catch {
    return [];
  }
};

const write = (q: ClockAction[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    /* storage full / unavailable — best effort */
  }
  emit();
};

export const enqueueClockAction = (action: ClockAction) => {
  write([...getClockQueue(), action]);
};

export const removeClockAction = (localId: string) => {
  write(getClockQueue().filter((a) => a.localId !== localId));
};

export const replaceClockQueue = (q: ClockAction[]) => write(q);

export const newLocalId = () =>
  `loc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * The effective pending clock session derived from the queue alone: a queued
 * clock-in with no later clock-out cancelling it. Lets the UI show "clocked in"
 * while offline before the punch has synced.
 */
export const pendingClockSession = (): ClockInAction | null => {
  const q = getClockQueue();
  // Walk forward; a clock_out referencing a pending clock-in cancels it.
  let active: ClockInAction | null = null;
  for (const a of q) {
    if (a.type === 'clock_in') active = a;
    else if (a.type === 'clock_out' && active && a.pendingClockInLocalId === active.localId) active = null;
  }
  return active;
};
