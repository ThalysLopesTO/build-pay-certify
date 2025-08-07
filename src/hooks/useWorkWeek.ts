
import { useMemo } from 'react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { useCompanySettings } from './useCompanySettings';

export const useWorkWeek = () => {
  const { settings } = useCompanySettings();

  const workWeeks = useMemo(() => {
    if (!settings) return null;

    const today = startOfDay(new Date());
    const weekEndingDay = settings.week_ending_day ?? 0; // Default to Sunday
    const frequency = (settings as any).timesheet_frequency ?? 'weekly';

    // Get the current day of week (0 = Sunday, 1 = Monday, etc.)
    const currentDayOfWeek = today.getDay();

    // Calculate days until the next period ending day
    let daysUntilWeekEnd = weekEndingDay - currentDayOfWeek;
    if (daysUntilWeekEnd <= 0) {
      daysUntilWeekEnd += 7; // Next week's ending day
    }

    // Calculate the current period's end date (based on week ending day)
    const currentPeriodEndDate = addDays(today, daysUntilWeekEnd);

    const periodLength = frequency === 'bi-weekly' ? 14 : 7;

    // Generate the last 3 periods
    const weeks = [] as any[];
    for (let i = 0; i < 3; i++) {
      const periodEndDate = subDays(currentPeriodEndDate, i * periodLength);
      const periodStartDate = subDays(periodEndDate, periodLength - 1);

      let label = '';
      if (i === 0) label = ' (Current)';
      else if (i === 1) label = ' (1 period ago)';
      else if (i === 2) label = ' (2 periods ago)';

      weeks.push({
        startDate: periodStartDate,
        endDate: periodEndDate,
        startDateFormatted: format(periodStartDate, 'MMM dd'),
        endDateFormatted: format(periodEndDate, 'MMM dd'),
        rangeFormatted: `${format(periodStartDate, 'MMM dd')} – ${format(periodEndDate, 'MMM dd')}`,
        rangeFormattedWithLabel: `${format(periodStartDate, 'MMM dd')} – ${format(periodEndDate, 'MMM dd')}${label}`,
        weekStartDateString: format(periodStartDate, 'yyyy-MM-dd'),
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
