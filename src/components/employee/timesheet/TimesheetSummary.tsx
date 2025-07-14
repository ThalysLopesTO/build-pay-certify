
import React from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from 'react-hook-form';

interface TimesheetSummaryProps {
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  form?: UseFormReturn<any>;
  disabled?: boolean;
}

const TimesheetSummary = ({ totalHours, hourlyRate, grossPay, form, disabled = false }: TimesheetSummaryProps) => {
  const { settings } = useCompanySettings();
  const taxPercentage = settings?.tax_percentage || 13;
  const showTaxBreakdown = settings?.show_tax_breakdown_to_employees ?? true;
  
  // Watch the tax_included field from the form (if form is provided)
  const taxIncluded = form ? form.watch('tax_included') : false;
  
  // Calculate tax breakdown
  const payBeforeTax = totalHours * hourlyRate; // Base pay without expenses
  const calculatedTax = taxIncluded ? (payBeforeTax * (taxPercentage / 100)) : 0;
  const finalTotalPay = grossPay + calculatedTax;

  return (
    <div className="bg-slate-50 p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Timesheet Summary</h3>
      
      {/* Tax Inclusion Toggle - only show if form is provided */}
      {form && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <FormField
            control={form.control}
            name="tax_included"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">
                    Include Tax ({taxPercentage}%) on Total Pay
                  </FormLabel>
                  <p className="text-sm text-slate-600">
                    When enabled, tax will be added to your gross pay for the final total.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}
      
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
          <p className="text-sm text-slate-600">Hours Pay</p>
          <p className="text-2xl font-bold text-purple-600">${payBeforeTax.toFixed(2)}</p>
        </div>
      </div>

      {/* Pay Breakdown */}
      {taxIncluded ? (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-slate-700">Pay Breakdown with Tax ({taxPercentage}%)</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Pay:</span>
              <span className="font-medium text-slate-800">${grossPay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tax ({taxPercentage}%):</span>
              <span className="font-medium text-blue-600">+${calculatedTax.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Final Total Pay:</span>
                <span className="font-bold text-green-600 text-lg">${finalTotalPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            * Tax is added to your gross pay for the final total amount.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-slate-700">Pay Summary</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Gross Pay:</span>
              <span className="font-bold text-green-600 text-lg">${grossPay.toFixed(2)}</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            * Tax is not included in this submission.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimesheetSummary;
