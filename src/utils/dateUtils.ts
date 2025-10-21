import { parse, format } from 'date-fns';

/**
 * Parses a date string (YYYY-MM-DD) from database as a local date
 * instead of UTC midnight. This prevents timezone conversion issues.
 * 
 * @param dateString - Date in YYYY-MM-DD format from database
 * @returns Date object representing the date in local timezone
 */
export const parseLocalDate = (dateString: string): Date => {
  // Parse as local date, not UTC
  return parse(dateString, 'yyyy-MM-dd', new Date());
};

/**
 * Formats a Date object to YYYY-MM-DD for database storage
 * Safe for all timezones - uses local date, not UTC
 */
export const formatDateForDB = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Formats a date string from database for display
 * Handles timezone correctly by parsing as local date first
 */
export const formatDateFromDB = (dateString: string, formatStr: string = 'MMM dd, yyyy'): string => {
  const localDate = parseLocalDate(dateString);
  return format(localDate, formatStr);
};
