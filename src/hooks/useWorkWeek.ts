
import { useMemo } from 'react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { useCompanySettings } from './useCompanySettings';

export const useWorkWeek = () => {
  const { settings } = useCompanySettings();

  const workWeek = useMemo(() => {
    if (!settings) return null;

    const today = startOfDay(new Date());
    const weekEndingDay = settings.week_ending_day ?? 0; // Default to Sunday
    
    // Get the current day of week (0 = Sunday, 1 = Monday, etc.)
    const currentDayOfWeek = today.getDay();
    
    // Calculate days until the next week ending day
    let daysUntilWeekEnd = weekEndingDay - currentDayOfWeek;
    if (daysUntilWeekEnd <= 0) {
      daysUntilWeekEnd += 7; // Next week's ending day
    }
    
    // Calculate the current work week's end date
    const weekEndDate = addDays(today, daysUntilWeekEnd);
    
    // Calculate the start date (7 days before the end date)
    const weekStartDate = subDays(weekEndDate, 6);
    
    return {
      startDate: weekStartDate,
      endDate: weekEndDate,
      startDateFormatted: format(weekStartDate, 'MMM dd'),
      endDateFormatted: format(weekEndDate, 'MMM dd'),
      rangeFormatted: `${format(weekStartDate, 'MMM dd')} – ${format(weekEndDate, 'MMM dd')}`,
      weekStartDateString: format(weekStartDate, 'yyyy-MM-dd'),
    };
  }, [settings]);

  return workWeek;
};
