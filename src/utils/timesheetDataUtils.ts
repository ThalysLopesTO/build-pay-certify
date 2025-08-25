export interface BiWeeklyData {
  days: Array<{
    date: string;
    hours: number;
    weekday: string;
  }>;
  week1Total: number;
  week2Total: number;
  grandTotal: number;
}

export const parseBiWeeklyJSON = (notes: string): BiWeeklyData | null => {
  try {
    const biweeklyMatch = notes.match(/__biweekly_json__=([A-Za-z0-9+/=]+)/);
    if (!biweeklyMatch) return null;
    
    const base64Data = biweeklyMatch[1];
    const jsonString = atob(base64Data);
    const data = JSON.parse(jsonString);
    
    if (!data.days || !Array.isArray(data.days)) return null;
    
    return data;
  } catch (error) {
    console.warn('Failed to parse bi-weekly JSON:', error);
    return null;
  }
};

export const calculateTotalFromWeeklyFields = (timesheet: any): number => {
  return (
    (timesheet.monday_hours || 0) +
    (timesheet.tuesday_hours || 0) +
    (timesheet.wednesday_hours || 0) +
    (timesheet.thursday_hours || 0) +
    (timesheet.friday_hours || 0) +
    (timesheet.saturday_hours || 0) +
    (timesheet.sunday_hours || 0)
  );
};

export const validateTimesheetHours = (timesheet: any) => {
  const storedTotal = timesheet.total_hours || 0;
  const biWeeklyData = parseBiWeeklyJSON(timesheet.notes || '');
  
  if (biWeeklyData) {
    // Use bi-weekly data as source of truth
    const calculatedTotal = biWeeklyData.days.reduce((sum, day) => sum + (day.hours || 0), 0);
    const isConsistent = Math.abs(storedTotal - calculatedTotal) < 0.01;
    
    return {
      isValid: isConsistent,
      storedTotal,
      calculatedTotal,
      source: 'biweekly',
      biWeeklyData,
      hasDiscrepancy: !isConsistent
    };
  } else {
    // Fall back to weekly fields
    const calculatedTotal = calculateTotalFromWeeklyFields(timesheet);
    const isConsistent = Math.abs(storedTotal - calculatedTotal) < 0.01;
    
    return {
      isValid: isConsistent,
      storedTotal,
      calculatedTotal,
      source: 'weekly',
      biWeeklyData: null,
      hasDiscrepancy: !isConsistent,
      missingBiWeeklyData: true
    };
  }
};

export const getCorrectTotalHours = (timesheet: any): number => {
  const validation = validateTimesheetHours(timesheet);
  
  // Always prefer calculated total over stored total for accuracy
  return validation.calculatedTotal;
};

export const shouldShowDataWarning = (timesheet: any): boolean => {
  const validation = validateTimesheetHours(timesheet);
  return validation.hasDiscrepancy || validation.missingBiWeeklyData || false;
};