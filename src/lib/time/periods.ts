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
  if (frequency === 'weekly') {
    const end = nextOccurrenceIncludingToday(today, weekEndingIdx);
    const start = addDays(end, -6);
    return { start: startOfDay(start), end: startOfDay(end) };
  }
  
  // For bi-weekly, establish a consistent cycle based on the company's week ending day
  // Create a reference date that aligns with the company's week structure
  // For weekEndingIdx = 4 (Thursday), periods should be Friday-Thursday, Friday-Thursday
  
  // Use a reference date that matches the week ending day
  // For Thursday week endings, use August 8, 2025 (Thursday) as reference
  // For Sunday week endings, use August 4, 2025 (Sunday) as reference
  let baseReference: Date;
  if (weekEndingIdx === 4) {
    baseReference = new Date('2025-08-08'); // Thursday, Aug 8, 2025
  } else if (weekEndingIdx === 0) {
    baseReference = new Date('2025-08-04'); // Sunday, Aug 4, 2025
  } else {
    // For other week ending days, calculate from a known Sunday
    baseReference = new Date('2025-08-04'); // Sunday, Aug 4, 2025
    const daysDiff = (weekEndingIdx - baseReference.getDay() + 7) % 7;
    baseReference = addDays(baseReference, daysDiff);
  }
  
  const referenceEnd = baseReference;
  
  // Calculate how many days since the reference bi-weekly period ended
  const daysSinceReference = Math.floor((today.getTime() - referenceEnd.getTime()) / (1000 * 60 * 60 * 24));
  
  // Find which bi-weekly period we're in
  const biWeeklyPeriodNumber = Math.floor(daysSinceReference / 14);
  
  // Calculate the end date of the current bi-weekly period
  let periodEnd = addDays(referenceEnd, biWeeklyPeriodNumber * 14);
  
  // If we're past the period end, move to the next period
  if (today > periodEnd) {
    periodEnd = addDays(periodEnd, 14);
  }
  
  const start = addDays(periodEnd, -13);
  const end = periodEnd;
  
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
