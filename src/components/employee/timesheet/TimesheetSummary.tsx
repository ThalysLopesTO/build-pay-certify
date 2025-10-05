/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect } from 'react';
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
  workerType?: 'employee' | 'subcontractor';
  onChange?: (values: any) => void;
}

const TimesheetSummary = ({ totalHours, hourlyRate, grossPay, form, disabled = false, workerType = 'subcontractor', onChange }: TimesheetSummaryProps) => {
  const { settings } = useCompanySettings();
  const taxPercentage = settings?.tax_percentage || 13;
  const showTaxBreakdown = settings?.show_tax_breakdown_to_employees ?? true;
  
  // Watch the tax_included field from the form (if form is provided)
  const taxIncluded = form ? form.watch('tax_included') : false;
  
  // Calculate tax breakdown and deductions based on worker type
  const payBeforeTax = totalHours * hourlyRate; // Base pay without expenses
  
  // For subcontractors: when taxIncluded is true, tax is ADDED ON TOP of gross pay
  // Example: $2,800 gross + 13% ($364) = $3,164 total
  const calculatedTax = taxIncluded ? (grossPay * (taxPercentage / 100)) : 0;
  
  // Employee deductions (only for payroll employees)
  const incomeTaxRate = 12.00; // Default rate, could come from user profile
  const cppRate = 5.95;
  const eiRate = 1.63;
  
  const incomeTax = workerType === 'employee' ? (grossPay * (incomeTaxRate / 100)) : 0;
  const cppDeduction = workerType === 'employee' ? (grossPay * (cppRate / 100)) : 0;
  const eiDeduction = workerType === 'employee' ? (grossPay * (eiRate / 100)) : 0;
  const totalDeductions = incomeTax + cppDeduction + eiDeduction;
  
  // For employees: deduct taxes from gross pay
  // For subcontractors: add tax on top when taxIncluded is true
  const finalTotalPay = workerType === 'employee' ? (grossPay - totalDeductions) : (grossPay + calculatedTax);

  useEffect(() => {
    onChange?.({ 
      totalPay: finalTotalPay, 
      tax: calculatedTax,
      totalHours: totalHours,
      grossPay: grossPay,
      hoursPay: payBeforeTax,
  });
  }, [grossPay, totalHours, hourlyRate, taxIncluded]);
  
  return (
    <div className="bg-slate-50 p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Timesheet Summary</h3>
      
      {/* Tax Inclusion Toggle - only show for subcontractors */}
      {form && workerType === 'subcontractor' && (
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
      
      {/* Employee Notice - only show for payroll employees */}
      {workerType === 'employee' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Payroll Employee</h4>
          <p className="text-sm text-blue-700">
            As a payroll employee, your deductions (income tax, CPP, EI) will be automatically calculated and applied to your gross pay.
          </p>
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
          <p className="text-2xl font-bold text-purple-600">${payBeforeTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Pay Breakdown - Different for employees vs subcontractors */}
      {workerType === 'employee' ? (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-slate-700">Payroll Employee - Pay Breakdown with Deductions</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Pay:</span>
              <span className="font-medium text-slate-800">${grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <div className="text-slate-600 mb-1">Deductions:</div>
              <div className="flex justify-between ml-4">
                <span className="text-slate-500">Income Tax ({incomeTaxRate}%):</span>
                <span className="font-medium text-red-600">-${incomeTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between ml-4">
                <span className="text-slate-500">CPP ({cppRate}%):</span>
                <span className="font-medium text-red-600">-${cppDeduction.toFixed(2)}</span>
              </div>
              <div className="flex justify-between ml-4">
                <span className="text-slate-500">EI ({eiRate}%):</span>
                <span className="font-medium text-red-600">-${eiDeduction.toFixed(2)}</span>
              </div>
              <div className="flex justify-between ml-4 font-medium">
                <span className="text-slate-600">Total Deductions:</span>
                <span className="text-red-600">-${totalDeductions.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Net Pay:</span>
                <span className="font-bold text-green-600 text-lg">${finalTotalPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            * Deductions are automatically calculated based on current tax rates.
          </p>
        </div>
      ) : (
        // Subcontractor pay breakdown
        taxIncluded ? (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-slate-700">Subcontractor - Pay Breakdown with Tax ({taxPercentage}%)</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Gross Pay:</span>
                <span className="font-medium text-slate-800">${grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax ({taxPercentage}%):</span>
                <span className="font-medium text-blue-600">+${calculatedTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">Final Total Pay:</span>
                  <span className="font-bold text-green-600 text-lg">${finalTotalPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-2">
              * Tax is added to your gross pay for the final total amount.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-slate-700">Subcontractor - Pay Summary</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Gross Pay:</span>
                <span className="font-bold text-green-600 text-lg">${grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-2">
              * Tax is not included in this submission.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default TimesheetSummary;
