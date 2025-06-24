
import { useMemo } from 'react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { useCompanySettings } from './useCompanySettings';

export const useWorkWeek = () => {
  const { settings } = useCompanySettings();

  const workWeeks = useMemo(() => {
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
    const currentWeekEndDate = addDays(today, daysUntilWeekEnd);
    
    // Generate the last 3 weeks
    const weeks = [];
    for (let i = 0; i < 3; i++) {
      const weekEndDate = subDays(currentWeekEndDate, i * 7);
      const weekStartDate = subDays(weekEndDate, 6);
      
      let label = '';
      if (i === 0) label = ' (Current)';
      else if (i === 1) label = ' (1 week ago)';
      else if (i === 2) label = ' (2 weeks ago)';
      
      weeks.push({
        startDate: weekStartDate,
        endDate: weekEndDate,
        startDateFormatted: format(weekStartDate, 'MMM dd'),
        endDateFormatted: format(weekEndDate, 'MMM dd'),
        rangeFormatted: `${format(weekStartDate, 'MMM dd')} – ${format(weekEndDate, 'MMM dd')}`,
        rangeFormattedWithLabel: `${format(weekStartDate, 'MMM dd')} – ${format(weekEndDate, 'MMM dd')}${label}`,
        weekStartDateString: format(weekStartDate, 'yyyy-MM-dd'),
        label: label.trim().replace(/[()]/g, '') || 'Current',
        isCurrent: i === 0,
      });
    }
    
    return {
      availableWeeks: weeks,
      currentWeek: weeks[0],
    };
  }, [settings]);

  return workWeeks;
};
