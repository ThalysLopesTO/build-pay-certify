
import React from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface TimesheetSummaryProps {
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
}

const TimesheetSummary = ({ totalHours, hourlyRate, grossPay }: TimesheetSummaryProps) => {
  const { settings } = useCompanySettings();
  const taxPercentage = settings?.tax_percentage || 13;
  
  // Calculate tax breakdown
  const payBeforeTax = totalHours * hourlyRate; // Base pay without expenses
  const estimatedTax = payBeforeTax * (taxPercentage / 100);
  const netPay = grossPay - estimatedTax; // Gross pay (including expenses) minus tax

  return (
    <div className="bg-slate-50 p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Timesheet Summary</h3>
      
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-slate-600">Total Hours</p>
          <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-600">Hourly Rate</p>
          <p className="text-2xl font-bold text-green-600">${hourlyRate.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-600">Total Hours Pay</p>
          <p className="text-2xl font-bold text-purple-600">${payBeforeTax.toFixed(2)}</p>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-slate-700">Tax Breakdown ({taxPercentage}%)</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Total Pay Before Tax:</span>
            <span className="font-medium text-slate-800">${grossPay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Estimated Tax ({taxPercentage}%):</span>
            <span className="font-medium text-red-600">-${estimatedTax.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Net Pay (Estimated):</span>
              <span className="font-bold text-green-600 text-lg">${netPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-2">
          * Tax calculation is for estimation purposes only. Actual deductions may vary.
        </p>
      </div>
    </div>
  );
};

export default TimesheetSummary;
