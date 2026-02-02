import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export type DateRangeType = 'today' | 'this-week' | 'this-month' | 'last-month' | 'year-to-date' | 'all-time' | 'custom';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface UseDateRangeFilterReturn {
  selectedRange: DateRangeType;
  setSelectedRange: (range: DateRangeType) => void;
  customRange: DateRange;
  setCustomRange: (range: DateRange) => void;
  effectiveRange: DateRange;
  isCustomRangeOpen: boolean;
  setIsCustomRangeOpen: (open: boolean) => void;
}

export const useDateRangeFilter = (
  initialRange: DateRangeType = 'this-month',
  initialCustomRange?: DateRange
): UseDateRangeFilterReturn => {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>(initialRange);
  const [customRange, setCustomRange] = useState<DateRange>(
    initialCustomRange || { start: null, end: null }
  );
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);

  const effectiveRange = useMemo((): DateRange => {
    const now = new Date();
    
    switch (selectedRange) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'this-week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'this-month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'year-to-date':
        return {
          start: startOfYear(now),
          end: now
        };
      case 'all-time':
        return {
          start: null,
          end: null
        };
      case 'custom':
        return customRange;
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  }, [selectedRange, customRange]);

  return {
    selectedRange,
    setSelectedRange,
    customRange,
    setCustomRange,
    effectiveRange,
    isCustomRangeOpen,
    setIsCustomRangeOpen,
  };
};