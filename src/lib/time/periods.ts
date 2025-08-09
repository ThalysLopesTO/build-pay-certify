import { addDays, startOfDay, endOfDay, format } from 'date-fns';

export type TimesheetFrequency = 'weekly' | 'bi-weekly';

export const getWeekdayIndex = (weekEndingDay: string | number): number => {
  if (typeof weekEndingDay === 'number') return Math.max(0, Math.min(6, weekEndingDay));
  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return map[String(weekEndingDay).toLowerCase()] ?? 0;
};

const nextOccurrenceIncludingToday = (date: Date, targetDow: number): Date => {
  const d = startOfDay(date);
  const diff = (targetDow - d.getDay() + 7) % 7; // 0..6 (0 => today)
  return addDays(d, diff);
};

export const getCurrentPeriod = ({
  today = new Date(),
  frequency,
  weekEndingIdx,
}: {
  today?: Date;
  frequency: TimesheetFrequency;
  weekEndingIdx: number;
}): { start: Date; end: Date } => {
  const end = nextOccurrenceIncludingToday(today, weekEndingIdx);
  const periodLength = frequency === 'bi-weekly' ? 14 : 7;
  const start = addDays(end, -(periodLength - 1));
  return { start: startOfDay(start), end: startOfDay(end) };
};

export const getPreviousPeriods = ({
  today = new Date(),
  frequency,
  weekEndingIdx,
  count,
}: {
  today?: Date;
  frequency: TimesheetFrequency;
  weekEndingIdx: number;
  count: number;
}): Array<{ start: Date; end: Date }> => {
  const { end: currentEnd } = getCurrentPeriod({ today, frequency, weekEndingIdx });
  const periodLength = frequency === 'bi-weekly' ? 14 : 7;
  const periods: Array<{ start: Date; end: Date }> = [];
  for (let i = 0; i < count; i++) {
    const end = addDays(currentEnd, -i * periodLength);
    const start = addDays(end, -(periodLength - 1));
    periods.push({ start: startOfDay(start), end: startOfDay(end) });
  }
  return periods;
};

export const isSubmissionOpen = (end: Date): boolean => {
  const now = new Date();
  return now >= endOfDay(end);
};

export const formatRange = (start: Date, end: Date): string => {
  return `${format(start, 'MMM dd')} – ${format(end, 'MMM dd')}`;
};

export const getDaysForPeriod = ({ start, end }: { start: Date; end: Date }): Array<{ iso: string; label: string; weekday: string }> => {
  const days: Array<{ iso: string; label: string; weekday: string }> = [];
  const s = startOfDay(start);
  const e = startOfDay(end);
  let d = s;
  while (d <= e) {
    days.push({
      iso: format(d, 'yyyy-MM-dd'),
      label: format(d, 'MMM dd'),
      weekday: format(d, 'EEEE'),
    });
    d = addDays(d, 1);
  }
  return days;
};
