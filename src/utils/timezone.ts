import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export const DEFAULT_TIMEZONE = 'America/Toronto';

/**
 * Formats a date string or Date object in the specified timezone
 */
export const formatInCompanyTimezone = (
  date: string | Date,
  formatString: string,
  timezone: string = DEFAULT_TIMEZONE
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, timezone, formatString);
};

/**
 * Converts a UTC date to the company's timezone
 */
export const toCompanyTimezone = (
  date: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, timezone);
};

/**
 * Converts a date from company timezone to UTC
 */
export const fromCompanyTimezone = (
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date => {
  return fromZonedTime(date, timezone);
};

/**
 * Gets the display date for daily reports in company timezone
 */
export const getReportDisplayDate = (
  reportDate: string,
  timezone: string = DEFAULT_TIMEZONE
): string => {
  // Convert the report date to the company timezone
  const dateInTimezone = toZonedTime(new Date(reportDate + 'T00:00:00'), timezone);
  return format(dateInTimezone, 'MMM dd, yyyy');
};

/**
 * Gets the display time for submissions in company timezone
 */
export const getSubmissionDisplayTime = (
  submissionDateTime: string,
  timezone: string = DEFAULT_TIMEZONE
): string => {
  return formatInCompanyTimezone(submissionDateTime, 'h:mm a', timezone);
};

/**
 * Gets the full display date and time for submissions
 */
export const getSubmissionDisplayDateTime = (
  submissionDateTime: string,
  timezone: string = DEFAULT_TIMEZONE
): string => {
  return formatInCompanyTimezone(submissionDateTime, 'MMM dd, yyyy – h:mm a', timezone);
};

/**
 * Common timezone options for company settings
 */
export const TIMEZONE_OPTIONS = [
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)' },
  { value: 'America/Edmonton', label: 'Mountain Time (Edmonton)' },
  { value: 'America/Winnipeg', label: 'Central Time (Winnipeg)' },
  { value: 'America/Halifax', label: 'Atlantic Time (Halifax)' },
  { value: 'America/St_Johns', label: 'Newfoundland Time (St. Johns)' },
];