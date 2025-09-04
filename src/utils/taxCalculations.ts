export interface TaxCalculation {
  grossPay: number;
  taxAmount: number;
  netPay: number;
  breakdown: {
    cpp?: number;
    ei?: number;
    federalTax?: number;
    provincialTax?: number;
    hst?: number;
  };
}

export const calculateEmployeeTax = (grossPay: number, taxPercentage: number = 13): TaxCalculation => {
  // Employee payroll deductions (2024 rates)
  const cppRate = 0.0595; // 5.95%
  const eiRate = 0.0229; // 2.29%
  const federalTaxRate = 0.15; // 15% basic rate
  const provincialTaxRate = (taxPercentage / 100) - 0.15; // Provincial rate minus federal

  const cpp = grossPay * cppRate;
  const ei = grossPay * eiRate;
  const federalTax = grossPay * federalTaxRate;
  const provincialTax = grossPay * Math.max(0, provincialTaxRate);

  const totalDeductions = cpp + ei + federalTax + provincialTax;
  const netPay = grossPay - totalDeductions;

  return {
    grossPay,
    taxAmount: totalDeductions,
    netPay,
    breakdown: {
      cpp,
      ei,
      federalTax,
      provincialTax
    }
  };
};

export const calculateSubcontractorTax = (grossPay: number, taxPercentage: number = 13, taxIncluded: boolean = false): TaxCalculation => {
  let hst: number;
  let netPay: number;

  if (taxIncluded) {
    // HST is included in the gross pay
    hst = grossPay * (taxPercentage / (100 + taxPercentage));
    netPay = grossPay - hst;
  } else {
    // HST is added to gross pay
    hst = grossPay * (taxPercentage / 100);
    netPay = grossPay + hst;
  }

  return {
    grossPay,
    taxAmount: hst,
    netPay,
    breakdown: {
      hst
    }
  };
};

export const calculatePayrollTotals = (
  totalHours: number,
  hourlyRate: number,
  expenses: number,
  workerType: 'employee' | 'subcontractor',
  taxPercentage: number = 13,
  taxIncluded: boolean = false
): TaxCalculation => {
  const grossPay = (totalHours * hourlyRate) + expenses;
  if (workerType === 'employee') {
    return calculateEmployeeTax(grossPay, taxPercentage);
  } else {
    return calculateSubcontractorTax(grossPay, taxPercentage, taxIncluded);
  }
};

export const calculateTax = ({
  type,
  tax_percentage = 13,
  gross_pay,
  tax_included = false,
  income_tax_rate = 12.00,
  cpp_rate = 5.95,
  ei_rate = 1.63
}:{ 
  type: 'employee' | 'subcontractor';
  tax_percentage?: number;
  gross_pay: number;
  tax_included?: boolean;
  income_tax_rate?: number;
  cpp_rate?: number;
  ei_rate?: number;
}) => {
  let totalPay = 0;
  let calculatedTax = 0;
  let deductions = 0;
  let incomeTax = 0;
  let cpp = 0;
  let ei = 0;

  if (type === 'subcontractor') {
    if (tax_included) {
      calculatedTax = gross_pay * (tax_percentage / (100 + tax_percentage));
    }
    totalPay = gross_pay + calculatedTax;
  } else {
    incomeTax = gross_pay * (income_tax_rate / 100);
    cpp = gross_pay * (cpp_rate / 100);
    ei = gross_pay * (ei_rate / 100);
    deductions = incomeTax + cpp + ei;
    totalPay = gross_pay - deductions;
  }

  return {
    totalPay,
    calculatedTax,
    deductions,
    incomeTax,
    cpp,
    ei,
    incomeTaxRate: income_tax_rate,
    cppRate: cpp_rate,
    eiRate: ei_rate
  };
}