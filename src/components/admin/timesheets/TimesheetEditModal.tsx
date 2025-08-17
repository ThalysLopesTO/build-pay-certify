
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Clock, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WeeklyHoursEditor from '@/components/admin/timesheets/WeeklyHoursEditor';
import { getDaysForPeriod } from '@/lib/time/periods';
import { addDays } from 'date-fns';

interface TimesheetEditModalProps {
  timesheet: any;
  onClose: () => void;
  onSave: (data: any, originalData: any) => void;
  isSaving: boolean;
}

const TimesheetEditModal: React.FC<TimesheetEditModalProps> = ({
  timesheet,
  onClose,
  onSave,
  isSaving
}) => {
  const { user } = useAuth();
  const { settings: companySettings, isLoading: settingsLoading } = useCompanySettings();
  const taxRate = companySettings?.tax_percentage || 13;
  
  // Permission check - only admin, super_admin, and management can edit timesheets
  const canEditTimesheets = user?.role && ['admin', 'super_admin', 'management'].includes(user.role);
  
  // Enhanced bi-weekly detection with fallback logic
  const isBiWeekly = (() => {
    // First check company settings
    if (companySettings?.timesheet_frequency === 'bi-weekly') return true;
    // Fallback: detect from timesheet notes containing bi-weekly data
    if (timesheet.notes && timesheet.notes.includes('__biweekly_json__=')) return true;
    return false;
  })();
  
  // Check worker type to determine what to show
  const isPayrollEmployee = timesheet.worker_type === 'employee';
  const isSubcontractor = timesheet.worker_type === 'subcontractor';
  
  const [formData, setFormData] = useState({
    monday_hours: timesheet.monday_hours || 0,
    tuesday_hours: timesheet.tuesday_hours || 0,
    wednesday_hours: timesheet.wednesday_hours || 0,
    thursday_hours: timesheet.thursday_hours || 0,
    friday_hours: timesheet.friday_hours || 0,
    saturday_hours: timesheet.saturday_hours || 0,
    sunday_hours: timesheet.sunday_hours || 0,
    additional_expense: timesheet.additional_expense || 0,
  });

  const [taxIncluded, setTaxIncluded] = useState(timesheet.tax_included || false);
  const [manualTaxAmount, setManualTaxAmount] = useState<string>('');
  const [isManualTax, setIsManualTax] = useState(false);
  
// Collapsible section states
  const [hoursOpen, setHoursOpen] = useState(true);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);

  const [openWeek, setOpenWeek] = useState<'week1' | 'week2'>('week1');

  // Period days for labels
  const startDate = timesheet.week_start_date ? new Date(timesheet.week_start_date) : null;
  const periodLength = isBiWeekly ? 14 : 7;
  const endDate = startDate ? addDays(startDate, periodLength - 1) : null;
  const allDays = startDate && endDate ? getDaysForPeriod({ start: startDate, end: endDate }) : [];
  const week1Days = allDays.slice(0, 7);
  const week2Days = allDays.slice(7, 14);

  // Employee notes (clean, no JSON blob)
  const stripBiWeeklyMeta = (raw?: string) => {
    if (!raw) return '';
    return raw
      .split('\n')
      .filter((l: string) => !l.startsWith('__biweekly_json__='))
       .join('\n')
       .trim();
   };
   const [notesText, setNotesText] = useState<string>(stripBiWeeklyMeta(timesheet.notes));

  // Enhanced bi-weekly hours parsing with better error handling
  const parseBiWeeklyHours = (notes?: string): number[] | null => {
    if (!notes || !isBiWeekly) return null;
    try {
      const line = notes.split('\n').find((l: string) => l.startsWith('__biweekly_json__='));
      if (!line) return null;
      
      const encodedData = line.split('=')[1];
      if (!encodedData) return null;
      
      const json = JSON.parse(atob(encodedData));
      if (Array.isArray(json?.days) && json.days.length === 14) {
        return json.days.map((d: any) => Number(d.hours || 0));
      }
      return null;
    } catch (error) {
      console.error('Error parsing bi-weekly hours:', error);
      return null;
    }
  };

  // Initialize bi-weekly hours with improved logic
  const initial14 = (() => {
    if (!isBiWeekly) {
      return new Array(14).fill(0);
    }
    
    const first7 = [
      Number(timesheet.monday_hours || 0),
      Number(timesheet.tuesday_hours || 0),
      Number(timesheet.wednesday_hours || 0),
      Number(timesheet.thursday_hours || 0),
      Number(timesheet.friday_hours || 0),
      Number(timesheet.saturday_hours || 0),
      Number(timesheet.sunday_hours || 0),
    ];
    
    const parsedWeek2 = parseBiWeeklyHours(timesheet.notes);
    const second7 = parsedWeek2?.slice(7, 14) || new Array(7).fill(0);
    
    return [...first7, ...second7];
  })();
  const [hours14, setHours14] = useState<number[]>(initial14);

  // Store original data for audit tracking
  const originalData = {
    monday_hours: timesheet.monday_hours || 0,
    tuesday_hours: timesheet.tuesday_hours || 0,
    wednesday_hours: timesheet.wednesday_hours || 0,
    thursday_hours: timesheet.thursday_hours || 0,
    friday_hours: timesheet.friday_hours || 0,
    saturday_hours: timesheet.saturday_hours || 0,
    sunday_hours: timesheet.sunday_hours || 0,
    additional_expense: timesheet.additional_expense || 0,
    total_hours: timesheet.total_hours || 0,
    gross_pay: timesheet.gross_pay || 0,
  };

  const totalHours = isBiWeekly
    ? hours14.reduce((sum, h) => sum + Number(h || 0), 0)
    : Object.entries(formData)
        .filter(([key]) => key.includes('_hours'))
        .reduce((sum, [, hours]) => sum + Number(hours), 0);

  const week1Total = isBiWeekly ? hours14.slice(0, 7).reduce((s, h) => s + Number(h || 0), 0) : totalHours;
  const week2Total = isBiWeekly ? hours14.slice(7, 14).reduce((s, h) => s + Number(h || 0), 0) : 0;
  const grossPay = totalHours * (timesheet.hourly_rate || 0);

  // State for deduction rates (editable for payroll employees)
  const [deductionRates, setDeductionRates] = useState({
    incomeTaxRate: Number(timesheet.income_tax_rate || 12), // Default 12%
    cppRate: Number(timesheet.cpp_rate || 5.95), // Default 5.95%
    eiRate: Number(timesheet.ei_rate || 1.63) // Default 1.63%
  });

  // Payroll deductions calculation for employees
  let payrollCalculations = null;
  if (isPayrollEmployee) {
    const grossWithExpenses = grossPay + Number(formData.additional_expense);
    const incomeTax = grossWithExpenses * (deductionRates.incomeTaxRate / 100);
    const cpp = grossWithExpenses * (deductionRates.cppRate / 100);
    const ei = grossWithExpenses * (deductionRates.eiRate / 100);
    const totalDeductions = incomeTax + cpp + ei;
    const netPay = grossWithExpenses - totalDeductions;
    
    payrollCalculations = {
      grossWithExpenses,
      incomeTax,
      cpp,
      ei,
      totalDeductions,
      netPay,
      incomeTaxRate: deductionRates.incomeTaxRate,
      cppRate: deductionRates.cppRate,
      eiRate: deductionRates.eiRate
    };
  }
  
  // Calculate tax amount for non-payroll employees
  const calculatedTax = taxIncluded ? (grossPay * (taxRate / 100)) : 0;
  const finalTaxAmount = isManualTax && manualTaxAmount !== '' 
    ? Number(manualTaxAmount) 
    : calculatedTax;
  
  const totalPay = isPayrollEmployee 
    ? payrollCalculations?.netPay || 0 
    : grossPay + Number(formData.additional_expense) + finalTaxAmount;

  const handleSave = () => {
    // Helper: embed/update hidden bi-weekly JSON line inside notes for exports
    const embedBiWeeklyMeta = (base: string, hours: number[]) => {
      const safeBase = (base || '')
        .split('\n')
        .filter((l) => !l.startsWith('__biweekly_json__='))
        .join('\n')
        .trim();
      const days = (allDays.length === 14 ? allDays : [...week1Days, ...week2Days]).map((d, i) => ({
        date: d.iso,
        label: d.weekday,
        hours: Number(hours[i] || 0),
      }));
      const meta = `__biweekly_json__=${btoa(JSON.stringify({ days }))}`;
      return safeBase ? `${safeBase}\n${meta}` : meta;
    };

    const computedGross = totalHours * (timesheet.hourly_rate || 0);

    const baseUpdates: any = {
      additional_expense: formData.additional_expense,
      tax_included: isPayrollEmployee ? false : taxIncluded,
      calculated_tax: isPayrollEmployee ? 0 : finalTaxAmount,
      // Save updated deduction rates for payroll employees
      income_tax_rate: isPayrollEmployee ? deductionRates.incomeTaxRate : timesheet.income_tax_rate,
      cpp_rate: isPayrollEmployee ? deductionRates.cppRate : timesheet.cpp_rate,
      ei_rate: isPayrollEmployee ? deductionRates.eiRate : timesheet.ei_rate,
    };

    if (isBiWeekly) {
      const week1 = hours14.slice(0, 7);
      const total = hours14.reduce((s, h) => s + Number(h || 0), 0);
      const gross = computedGross;
      const updates = {
        ...baseUpdates,
        monday_hours: week1[0] || 0,
        tuesday_hours: week1[1] || 0,
        wednesday_hours: week1[2] || 0,
        thursday_hours: week1[3] || 0,
        friday_hours: week1[4] || 0,
        saturday_hours: week1[5] || 0,
        sunday_hours: week1[6] || 0,
        total_hours: total,
        gross_pay: isPayrollEmployee && payrollCalculations
          ? payrollCalculations.netPay
          : gross + Number(formData.additional_expense) + finalTaxAmount,
        notes: embedBiWeeklyMeta(timesheet.notes, hours14),
      };
      onSave(updates, originalData);
    } else {
      const updates = {
        ...baseUpdates,
        ...formData,
        total_hours: totalHours,
        gross_pay: isPayrollEmployee && payrollCalculations
          ? payrollCalculations.netPay
          : computedGross + Number(formData.additional_expense) + finalTaxAmount,
        notes: notesText,
      };
      onSave(updates, originalData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: Number(value) || 0
    }));
  };

  // Permission check UI
  if (!canEditTimesheets) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to edit timesheets. Only administrators and managers can edit timesheet entries.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading state while fetching company settings
  if (settingsLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Timesheet {isBiWeekly && <span className="text-sm font-normal text-muted-foreground">(Bi-weekly)</span>}
          </DialogTitle>
          {/* Employee Type Label */}
          <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
            <span className="font-medium">Employee Type:</span> 
            {isPayrollEmployee ? ' Payroll — With Deductions' : ' Subcontractor (HST Optional)'}
            {isBiWeekly && (
              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                BI-WEEKLY
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Summary Section - Always Visible */}
        <div className="flex-shrink-0 bg-muted/50 rounded-lg p-4 mb-4">
          {isPayrollEmployee && payrollCalculations ? (
            // Payroll employee summary with deductions
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{totalHours.toFixed(1)}h</div>
                <div className="text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">${payrollCalculations.grossWithExpenses.toFixed(2)}</div>
                <div className="text-muted-foreground">Gross Pay</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">${payrollCalculations.totalDeductions.toFixed(2)}</div>
                <div className="text-muted-foreground">Total Deductions</div>
              </div>
              <div className="text-center md:col-span-3">
                <div className="font-semibold text-xl text-primary">${payrollCalculations.netPay.toFixed(2)}</div>
                <div className="text-muted-foreground font-medium">Net Pay</div>
              </div>
            </div>
          ) : (
            // Standard summary for subcontractors and employees without deductions
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{totalHours.toFixed(1)}h</div>
                <div className="text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">${grossPay.toFixed(2)}</div>
                <div className="text-muted-foreground">Gross Pay</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">${finalTaxAmount.toFixed(2)}</div>
                <div className="text-muted-foreground">Tax</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-primary">${totalPay.toFixed(2)}</div>
                <div className="text-muted-foreground">Total Pay</div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          
          {/* Weekly Hours Section */}
          {isBiWeekly ? (
            <div className="space-y-3">
              {/* Week 1 */}
              <Collapsible open={openWeek === 'week1'} onOpenChange={(open) => setOpenWeek(open ? 'week1' : openWeek)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50"
                    onClick={() => setOpenWeek('week1')}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Week 1</span>
                      <span className="text-sm text-muted-foreground">({week1Total.toFixed(1)}h)</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openWeek === 'week1' ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <WeeklyHoursEditor
                    days={week1Days}
                    values={hours14.slice(0, 7)}
                    onChange={(idx, val) => {
                      setHours14((prev) => {
                        const copy = [...prev];
                        copy[idx] = val;
                        return copy;
                      });
                    }}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Week 2 */}
              <Collapsible open={openWeek === 'week2'} onOpenChange={(open) => setOpenWeek(open ? 'week2' : openWeek)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50"
                    onClick={() => setOpenWeek('week2')}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Week 2</span>
                      <span className="text-sm text-muted-foreground">({week2Total.toFixed(1)}h)</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openWeek === 'week2' ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <WeeklyHoursEditor
                    days={week2Days}
                    values={hours14.slice(7, 14)}
                    onChange={(idx, val) => {
                      setHours14((prev) => {
                        const copy = [...prev];
                        copy[7 + idx] = val;
                        return copy;
                      });
                    }}
                  />
                </CollapsibleContent>
              </Collapsible>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="font-semibold text-lg">{week1Total.toFixed(1)}h</div>
                  <div className="text-muted-foreground">Week 1 Total</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{week2Total.toFixed(1)}h</div>
                  <div className="text-muted-foreground">Week 2 Total</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{totalHours.toFixed(1)}h</div>
                  <div className="text-muted-foreground">Grand Total</div>
                </div>
              </div>
            </div>
          ) : (
            <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Weekly Hours</span>
                    <span className="text-sm text-muted-foreground">({totalHours.toFixed(1)}h total)</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${hoursOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(formData).filter(([key]) => key.includes('_hours')).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-3">
                      <Label className="w-20 text-sm capitalize">
                        {day.replace('_hours', '')}:
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={hours}
                        onChange={(e) => handleInputChange(day, e.target.value)}
                        className="h-9"
                      />
                      <span className="text-xs text-muted-foreground w-8">hrs</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Additional Expenses Section */}
          <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Additional Expenses</span>
                  <span className="text-sm text-muted-foreground">(${formData.additional_expense.toFixed(2)})</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${expensesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm">
                  Amount ($):
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.additional_expense}
                  onChange={(e) => handleInputChange('additional_expense', e.target.value)}
                  placeholder="0.00"
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground">CAD</span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Payroll Deductions Section for Employees or Tax Control for Subcontractors */}
          {isPayrollEmployee && payrollCalculations ? (
            // Payroll Deductions Section for employees with deductions
            <div className="border rounded-lg p-4 bg-blue-50/50">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Payroll Deductions (Editable)
              </h4>
              
              {/* Editable Deduction Rates */}
              <div className="mb-4 p-3 bg-background/60 rounded-lg">
                <Label className="text-xs font-medium mb-2 block">Deduction Rates:</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Income Tax (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={deductionRates.incomeTaxRate}
                      onChange={(e) => setDeductionRates(prev => ({
                        ...prev,
                        incomeTaxRate: parseFloat(e.target.value) || 0
                      }))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CPP (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={deductionRates.cppRate}
                      onChange={(e) => setDeductionRates(prev => ({
                        ...prev,
                        cppRate: parseFloat(e.target.value) || 0
                      }))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">EI (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={deductionRates.eiRate}
                      onChange={(e) => setDeductionRates(prev => ({
                        ...prev,
                        eiRate: parseFloat(e.target.value) || 0
                      }))}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span>Gross Pay (Hours + Expenses):</span>
                  <span className="font-mono">${payrollCalculations.grossWithExpenses.toFixed(2)}</span>
                </div>
                <div className="border-l-2 border-blue-200 pl-3 space-y-2">
                  <div className="flex justify-between">
                    <span>CPP ({payrollCalculations.cppRate.toFixed(2)}%):</span>
                    <span className="font-mono">-${payrollCalculations.cpp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EI ({payrollCalculations.eiRate.toFixed(2)}%):</span>
                    <span className="font-mono">-${payrollCalculations.ei.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Income Tax ({payrollCalculations.incomeTaxRate.toFixed(2)}%):</span>
                    <span className="font-mono">-${payrollCalculations.incomeTax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Deductions:</span>
                  <span className="font-mono text-red-600">-${payrollCalculations.totalDeductions.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Net Pay:</span>
                  <span className="font-mono text-primary">${payrollCalculations.netPay.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            // Tax Control Section for subcontractors and employees without deductions
            <Collapsible open={taxOpen} onOpenChange={setTaxOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50 bg-orange-50/50"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Tax Control</span>
                    <span className="text-sm text-muted-foreground">
                      ({taxIncluded ? `$${finalTaxAmount.toFixed(2)}` : 'No tax'})
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${taxOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="bg-orange-50/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tax-toggle" className="text-sm font-medium">
                      Include Tax on this Timesheet
                    </Label>
                    <Switch
                      id="tax-toggle"
                      checked={taxIncluded}
                      onCheckedChange={setTaxIncluded}
                    />
                  </div>

                  <div className="text-sm text-muted-foreground bg-background/60 rounded px-3 py-2">
                    Company Tax Rate: <span className="font-medium">{taxRate}%</span>
                  </div>

                  {taxIncluded && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Label className="w-32 text-sm font-medium">
                          Tax Amount ($):
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={isManualTax ? manualTaxAmount : calculatedTax.toFixed(2)}
                          onChange={(e) => {
                            setManualTaxAmount(e.target.value);
                            setIsManualTax(true);
                          }}
                          onFocus={() => setIsManualTax(true)}
                          placeholder={calculatedTax.toFixed(2)}
                          className="h-9"
                        />
                        <span className="text-xs text-muted-foreground">CAD</span>
                      </div>
                      {isManualTax && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsManualTax(false);
                            setManualTaxAmount('');
                          }}
                          className="text-xs text-muted-foreground h-8"
                        >
                          Reset to calculated amount (${calculatedTax.toFixed(2)})
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Employee Notes Section */}
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Employee Notes
            </h4>
            <Textarea
              placeholder="Add any additional notes about this timesheet..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-2">These notes will show on the PDF. They won't affect hours or totals.</p>
          </div>

          {/* Detailed Summary */}
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculation Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Hours × Rate:</span>
                <span className="font-mono">{totalHours.toFixed(2)}h × ${(timesheet.hourly_rate || 0).toFixed(2)} = ${grossPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Additional Expenses:</span>
                <span className="font-mono">${formData.additional_expense.toFixed(2)}</span>
              </div>
              {isPayrollEmployee && payrollCalculations ? (
                <>
                  <div className="flex justify-between border-t pt-2">
                    <span>Gross Pay (with expenses):</span>
                    <span className="font-mono">${payrollCalculations.grossWithExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Total Deductions:</span>
                    <span className="font-mono">-${payrollCalculations.totalDeductions.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Net Pay:</span>
                    <span className="font-mono text-primary">${payrollCalculations.netPay.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Tax ({taxIncluded ? taxRate : 0}%):</span>
                    <span className="font-mono">${finalTaxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Pay:</span>
                    <span className="font-mono text-primary">${totalPay.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="px-6">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetEditModal;
