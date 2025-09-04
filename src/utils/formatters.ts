export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

export const formatCurrencyWithTax = (amount: number, taxIncluded: boolean = false): string => {
  const formatted = formatCurrency(amount);
  return taxIncluded ? `${formatted} (incl. HST)` : `${formatted} (+ HST)`;
};

export const formatTaxBreakdown = (grossPay: number, netPay: number, taxAmount: number, isSubcontractor: boolean = false, taxIncluded: boolean = false) => {
  return {
    gross: formatCurrency(grossPay),
    net: formatCurrency(netPay),
    tax: formatCurrency(taxAmount),
    taxPercentage: grossPay > 0 ? ((taxAmount / grossPay) * 100).toFixed(1) : '0.0',
    isAddition: isSubcontractor && taxIncluded, // For subcontractors, tax is added
    netLabel: isSubcontractor && taxIncluded ? 'Total Pay' : 'Net Pay'
  };
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};

/**
 * Format date in company timezone
 */
export const formatDateInTimezone = (
  date: string | Date,
  timezone: string = 'America/Toronto'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(dateObj);
};

/**
 * Format time in company timezone
 */
export const formatTimeInTimezone = (
  date: string | Date,
  timezone: string = 'America/Toronto'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(dateObj);
};

/**
 * Format date and time in company timezone
 */
export const formatDateTimeInTimezone = (
  date: string | Date,
  timezone: string = 'America/Toronto'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(dateObj);
};