/**
 * Week helpers for the Weekly Schedule. A week always starts on Monday and is
 * identified by its Monday as a 'yyyy-MM-dd' string, matching `week_start` in
 * the DB. Dates are handled at local noon so DST never shifts a day.
 */

export const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const atNoon = (iso: string): Date => new Date(`${iso}T12:00:00`);

export const toISODate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const todayISO = (): string => toISODate(new Date());

/** Monday of the week containing `date` (defaults to today). */
export const getWeekStart = (date?: string | Date): string => {
  const d = typeof date === 'string' ? atNoon(date) : new Date(date ?? new Date());
  if (Number.isNaN(d.getTime())) return getWeekStart();
  d.setHours(12, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sunday
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
};

export const addWeeks = (weekStart: string, count: number): string => {
  const d = atNoon(weekStart);
  d.setDate(d.getDate() + count * 7);
  return toISODate(d);
};

/** The 7 dates of a week, Monday → Sunday. */
export const weekDates = (weekStart: string): string[] => {
  const d = atNoon(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return toISODate(day);
  });
};

const ordinal = (n: number): string => {
  if (n > 3 && n < 21) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

/** '2026-08-24' -> 'Monday Aug 24th' — the format they use on the sheet. */
export const formatDayLabel = (iso: string): string => {
  const d = atNoon(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday} ${month} ${ordinal(d.getDate())}`;
};

/** 'Aug 24 – Aug 30, 2026' */
export const formatWeekRange = (weekStart: string): string => {
  const start = atNoon(weekStart);
  const end = atNoon(addWeeks(weekStart, 1));
  end.setDate(end.getDate() - 1);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
};

/** '08:00' -> '8:00am'. Free text (e.g. 'To be confirmed') passes through. */
export const formatScheduleTime = (value?: string | null): string => {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return raw;
  const h = Number(match[1]);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${match[2]}${suffix}`;
};

export const isCurrentWeek = (weekStart: string): boolean => weekStart === getWeekStart();
