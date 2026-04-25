export interface DayEntry {
  date: string; // 'yyyy-MM-dd'
  day: string; // 'Monday'
  hours: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Build day-by-day list between two date strings (inclusive).
 * Uses local-noon parsing to avoid timezone shifts.
 */
export const buildDailyHours = (
  startDate: string | undefined,
  endDate: string | undefined,
  existing?: DayEntry[]
): DayEntry[] => {
  if (!startDate || !endDate) return [];
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const result: DayEntry[] = [];
  const cursor = new Date(start);
  const existingMap = new Map((existing ?? []).map(e => [e.date, e.hours]));

  while (cursor <= end) {
    const dateStr = formatDate(cursor);
    result.push({
      date: dateStr,
      day: DAY_NAMES[cursor.getDay()],
      hours: existingMap.get(dateStr) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

export const sumHours = (days: DayEntry[]): number =>
  days.reduce((acc, d) => acc + (Number(d.hours) || 0), 0);

export const formatDateLong = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
