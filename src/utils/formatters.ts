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

export const formatTaxBreakdown = (grossPay: number, netPay: number, taxAmount: number) => {
  return {
    gross: formatCurrency(grossPay),
    net: formatCurrency(netPay),
    tax: formatCurrency(taxAmount),
    taxPercentage: grossPay > 0 ? ((taxAmount / grossPay) * 100).toFixed(1) : '0.0'
  };
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};