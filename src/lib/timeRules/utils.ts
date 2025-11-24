import { parseISO, format, parse, differenceInMinutes, setHours, setMinutes } from 'date-fns';

/**
 * Parse a time string (HH:MM) and combine it with a date to create a full Date object
 */
export function parseTimeToDate(dateString: string, timeString: string): Date {
  const date = parseISO(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  return setMinutes(setHours(date, hours), minutes);
}

/**
 * Clamp a timestamp between min and max times on the same date
 */
export function clamp(
  timestamp: Date,
  minTime: Date,
  maxTime: Date
): Date {
  if (timestamp < minTime) return minTime;
  if (timestamp > maxTime) return maxTime;
  return timestamp;
}

/**
 * Calculate difference in minutes between two timestamps
 */
export function diffInMinutes(start: Date, end: Date): number {
  return Math.max(0, differenceInMinutes(end, start));
}

/**
 * Apply unpaid break deduction if applicable
 */
export function applyBreak(
  totalMinutes: number,
  breakMinutes: number,
  breakIsPaid: boolean
): number {
  if (!breakIsPaid && breakMinutes > 0 && totalMinutes >= breakMinutes) {
    return totalMinutes - breakMinutes;
  }
  return totalMinutes;
}

/**
 * Generate flags based on punch times and rules
 */
export function generateFlags({
  rawIn,
  rawOut,
  effectiveStart,
  effectiveEnd,
  ruleStartTime,
  ruleEndTime,
  earlyGraceMinutes,
  lateGraceMinutes,
  paidMinutes,
}: {
  rawIn: Date;
  rawOut: Date;
  effectiveStart: Date;
  effectiveEnd: Date;
  ruleStartTime: Date;
  ruleEndTime: Date;
  earlyGraceMinutes: number;
  lateGraceMinutes: number;
  paidMinutes: number;
}): string[] {
  const flags: string[] = [];

  // Check for invalid punch (out before in)
  if (rawOut <= rawIn) {
    flags.push('INVALID');
    return flags;
  }

  // Early punch (punched in before scheduled start minus grace)
  const earlyThreshold = setMinutes(ruleStartTime, ruleStartTime.getMinutes() - earlyGraceMinutes);
  if (rawIn < earlyThreshold) {
    flags.push('EARLY_PUNCH');
  }

  // Late arrival (punched in after scheduled start plus grace)
  const lateThreshold = setMinutes(ruleStartTime, ruleStartTime.getMinutes() + lateGraceMinutes);
  if (rawIn > lateThreshold) {
    flags.push('LATE_ARRIVAL');
  }

  // After end (punched out after scheduled end)
  if (rawOut > ruleEndTime) {
    flags.push('AFTER_END');
  }

  // Short day (worked less than expected)
  const expectedMinutes = diffInMinutes(ruleStartTime, ruleEndTime);
  if (paidMinutes < expectedMinutes * 0.8) { // Less than 80% of expected
    flags.push('SHORT_DAY');
  }

  return flags;
}

/**
 * Format a Date object to HH:MM time string
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Format a Date object to ISO string
 */
export function formatISO(date: Date): string {
  return date.toISOString();
}
