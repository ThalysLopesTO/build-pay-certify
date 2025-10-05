import { addDays, startOfDay, endOfDay, format, getDay, isAfter } from 'date-fns';

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
  if (frequency === 'weekly') {
    const end = nextOccurrenceIncludingToday(today, weekEndingIdx);
    const start = addDays(end, -6);
    return { start: startOfDay(start), end: startOfDay(end) };
  }

  // For bi-weekly periods, ensure they always start on Friday and end on Thursday
  // for Thursday week-ending companies (Aug 8 - Aug 21 pattern)

  // Find the most recent occurrence of the week ending day
  const mostRecentEndDay = nextOccurrenceIncludingToday(today, weekEndingIdx);

  // Use a known reference date - August 21, 2024 was a Thursday (end of bi-weekly period)
  // This ensures Aug 8 - Aug 21 pattern for Thursday week-ending companies
  const referenceEnd = new Date('2024-08-21');

  // Calculate days since reference end
  const daysSinceRef = Math.floor((mostRecentEndDay.getTime() - referenceEnd.getTime()) / (1000 * 60 * 60 * 24));

  // Find which bi-weekly cycle we're in (cycles are 14 days apart)
  const biWeeklyCycle = Math.floor(daysSinceRef / 14);

  // Calculate the end date of the current bi-weekly period
  let periodEnd = addDays(referenceEnd, biWeeklyCycle * 14);

  // If today is after this period end, move to next period
  if (today > periodEnd) {
    periodEnd = addDays(periodEnd, 14);
  }

  // For bi-weekly periods, start is always Friday (14 days before end + 1)
  // This ensures Friday-Thursday boundaries: Aug 8 (Fri) - Aug 21 (Thu)
  const start = addDays(periodEnd, -13);
  const end = periodEnd;

  return { start: startOfDay(start), end: startOfDay(end) };
};

export const getPreviousPeriods = ({
  startDate = new Date(),
  frequency,
}: {
  startDate?: Date;
  frequency: TimesheetFrequency;
  // weekEndingIdx: number;
  // count: number;
}): Array<{ start: Date; end: Date }> => {
  const periodLength = frequency === "bi-weekly" ? 14 : 7;
  const periods: Array<{ start: Date; end: Date }> = [];

  const today = startOfDay(new Date());
  const start = startOfDay(startDate);

  // Align to the FRIDAY inside the same week as startDate
  // getDay() → 0=Sun, 5=Fri
  const dayOfWeek = getDay(start);
  const offsetToFriday = (5 - dayOfWeek + 7) % 7;
  const firstFriday = addDays(start, offsetToFriday); // Friday in that week
  const firstEnd = addDays(firstFriday, periodLength - 1); // Thursday after that Friday

  let currentStart = firstFriday;
  let currentEnd = firstEnd;

  // Generate periods up to today
  while (!isAfter(currentStart, today)) {
    periods.push({
      start: startOfDay(currentStart),
      end: startOfDay(currentEnd),
    });

    currentStart = addDays(currentEnd, 1);
    currentEnd = addDays(currentStart, periodLength - 1);
  }

  // Return the last 3 periods (most recent first)
  return periods.reverse().slice(0,3);
};

export const isSubmissionOpen = (end: Date): boolean => {
  const now = new Date();
  return now >= startOfDay(end);
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

export const getBiWeeklyDays = ({ start, end }: { start: Date; end: Date }): { week1Days: Array<{ iso: string; label: string; weekday: string }>, week2Days: Array<{ iso: string; label: string; weekday: string }> } => {
  const allDays = getDaysForPeriod({ start, end });

  // For bi-weekly periods, split into two weeks (7 days each)
  const week1Days = allDays.slice(0, 7);
  const week2Days = allDays.slice(7, 14);

  return { week1Days, week2Days };
};
