import { calculateWorkedHours, CalculateWorkedHoursResult } from '@/lib/timeRules/calculateWorkedHours';

/**
 * React hook wrapper for calculateWorkedHours
 * Provides easy access to the calculation function in components
 */
export function useCalculateWorkedHours() {
  return {
    calculate: calculateWorkedHours,
  };
}
