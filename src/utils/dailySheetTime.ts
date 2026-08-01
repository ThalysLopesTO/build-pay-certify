/**
 * Helpers for Daily Sheet time math. Times are 'HH:mm' 24h strings.
 */

export const isValidTime = (t?: string): boolean =>
  !!t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Hours worked between start and end, minus break minutes.
 * Handles overnight shifts (end earlier than start rolls to next day).
 */
export const calcHours = (start?: string, end?: string, breakMinutes = 0): number => {
  if (!isValidTime(start) || !isValidTime(end)) return 0;
  let diff = toMinutes(end!) - toMinutes(start!);
  if (diff < 0) diff += 24 * 60;
  diff -= Math.max(0, Number(breakMinutes) || 0);
  if (diff <= 0) return 0;
  return +(diff / 60).toFixed(2);
};

/** 'HH:mm' -> '7:30 AM' */
export const formatTime12h = (t?: string): string => {
  if (!isValidTime(t)) return '—';
  const [h, m] = t!.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const formatDateLongLocal = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const todayLocalISO = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
