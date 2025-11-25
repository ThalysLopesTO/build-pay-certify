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
  // Parse the YYYY-MM-DD format date and format it properly
  const [year, month, day] = reportDate.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return format(date, 'MMM dd, yyyy');
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
 * 
 * Uses IANA timezone identifiers (e.g., 'America/New_York') which automatically
 * handle Daylight Saving Time transitions via date-fns-tz.
 * 
 * DO NOT use timezone abbreviations (EST, PST, etc.) as they are ambiguous.
 * Phoenix uses Mountain Time without DST, hence the separate entry.
 */
export const TIMEZONE_OPTIONS = [
  // Eastern Time Zone
  { value: 'America/New_York', label: 'Eastern Time (New York, US)' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto, Canada)' },
  
  // Central Time Zone
  { value: 'America/Chicago', label: 'Central Time (Chicago, US)' },
  { value: 'America/Winnipeg', label: 'Central Time (Winnipeg, Canada)' },
  
  // Mountain Time Zone
  { value: 'America/Denver', label: 'Mountain Time (Denver, US)' },
  { value: 'America/Phoenix', label: 'Mountain Time - No DST (Phoenix, US)' },
  { value: 'America/Edmonton', label: 'Mountain Time (Edmonton, Canada)' },
  
  // Pacific Time Zone
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles, US)' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver, Canada)' },
  
  // Alaska Time Zone
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage, US)' },
  
  // Hawaii-Aleutian Time Zone
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time (Honolulu, US)' },
  
  // Atlantic Time Zone
  { value: 'America/Halifax', label: 'Atlantic Time (Halifax, Canada)' },
  
  // Newfoundland Time Zone
  { value: 'America/St_Johns', label: 'Newfoundland Time (St. Johns, Canada)' },
];