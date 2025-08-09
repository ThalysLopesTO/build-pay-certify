
import { useMemo } from 'react';
import { format } from 'date-fns';
import { useCompanySettings } from './useCompanySettings';
import { getCurrentPeriod, getPreviousPeriods, isSubmissionOpen, formatRange } from '@/lib/time/periods';

export const useWorkWeek = () => {
  const { settings } = useCompanySettings();

  const workWeeks = useMemo(() => {
    if (!settings) return null;

    const weekEndingIdx = settings.week_ending_day ?? 0; // 0=Sun
    const frequency = ((settings as any).timesheet_frequency ?? 'weekly') as 'weekly' | 'bi-weekly';

    // Build current + previous 2 periods
    const periods = getPreviousPeriods({ today: new Date(), frequency, weekEndingIdx, count: 3 });

    const weeks = periods.map((p, idx) => {
      const current = idx === 0;
      const label = current ? 'Current' : `${idx} period${idx > 1 ? 's' : ''} ago`;
      return {
        startDate: p.start,
        endDate: p.end,
        startDateFormatted: format(p.start, 'MMM dd'),
        endDateFormatted: format(p.end, 'MMM dd'),
        rangeFormatted: formatRange(p.start, p.end),
        rangeFormattedWithLabel: `${formatRange(p.start, p.end)} ${current ? '' : `(${label})`}`.trim(),
        weekStartDateString: format(p.start, 'yyyy-MM-dd'),
        label,
        isCurrent: current,
        isSubmissionOpen: isSubmissionOpen(p.end),
      } as any;
    });

    return {
      availableWeeks: weeks,
      currentWeek: weeks[0],
    };
  }, [settings]);

  return workWeeks;
};
