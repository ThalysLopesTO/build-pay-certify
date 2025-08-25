import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, AlertTriangle } from 'lucide-react';
import WeeklyHoursEditor from '@/components/admin/timesheets/WeeklyHoursEditor';
import { BiWeeklyHoursEditor } from '@/components/admin/timesheets/BiWeeklyHoursEditor';
import { TimesheetSummaryCard } from '@/components/admin/timesheets/TimesheetSummaryCard';
import { getDaysForPeriod, getWeekdayIndex, getCurrentPeriod } from '@/lib/time/periods';
import { addDays, format } from 'date-fns';
import { useMemo } from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/contexts/SupabaseAuthContext';

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

  // Calculate the correct period dates using fixed logic
  const { periodStart, periodEnd } = useMemo(() => {
    if (!companySettings) return { periodStart: new Date(), periodEnd: new Date() };
    
    const weekEndingIdx = getWeekdayIndex(companySettings.week_ending_day || 0);
    const frequency = companySettings.timesheet_frequency || 'weekly';
    
    // For bi-weekly timesheets, calculate the correct period based on the start date
    if (frequency === 'bi-weekly' && timesheet.week_start_date) {
      const start = new Date(timesheet.week_start_date);
      const end = addDays(start, 13); // 14-day period (13 days after start)
      return { periodStart: start, periodEnd: end };
    }
    
    // For weekly timesheets
    if (timesheet.week_start_date) {
      const start = new Date(timesheet.week_start_date);
      const end = addDays(start, 6); // 7-day period
      return { periodStart: start, periodEnd: end };
    }
    
    // Fallback to current period calculation and transform to consistent format
    const currentPeriod = getCurrentPeriod({
      today: new Date(),
      frequency,
      weekEndingIdx
    });
    return { periodStart: currentPeriod.start, periodEnd: currentPeriod.end };
  }, [companySettings, timesheet.week_start_date]);

  // Generate days arrays for bi-weekly display
  const { allDays, week1Days, week2Days } = useMemo(() => {
    const all = getDaysForPeriod({ start: periodStart, end: periodEnd });
    
    if (isBiWeekly && all.length >= 14) {
      return {
        allDays: all,
        week1Days: all.slice(0, 7),
        week2Days: all.slice(7, 14)
      };
    }
    
    return {
      allDays: all,
      week1Days: all.slice(0, 7),
      week2Days: []
    };
  }, [periodStart, periodEnd, isBiWeekly]);

  // State for hours (both weekly and bi-weekly)
  const [hours, setHours] = useState<number[]>(() => {
    if (!isBiWeekly) {
      return [
        timesheet.monday_hours || 0,
        timesheet.tuesday_hours || 0,
        timesheet.wednesday_hours || 0,
        timesheet.thursday_hours || 0,
        timesheet.friday_hours || 0,
        timesheet.saturday_hours || 0,
        timesheet.sunday_hours || 0,
      ];
    }
    return Array(7).fill(0);
  });

  // State for bi-weekly hours (14 days)
  const [hours14, setHours14] = useState<number[]>(() => {
    if (isBiWeekly) {
      // Try to parse from bi-weekly JSON first
      if (timesheet.notes && timesheet.notes.includes('__biweekly_json__=')) {
        try {
          const base64Match = timesheet.notes.match(/__biweekly_json__=([^_\s]+)__end_biweekly_json__/);
          if (base64Match) {
            const decoded = atob(base64Match[1]);
            const data = JSON.parse(decoded);
            if (data.days && Array.isArray(data.days)) {
              return data.days.map((day: any) => day.hours || 0);
            }
          }
        } catch (e) {
          console.error('Error parsing bi-weekly JSON:', e);
        }
      }
      
      // Fallback to individual columns
      return [
        timesheet.monday_hours || 0,
        timesheet.tuesday_hours || 0,
        timesheet.wednesday_hours || 0,
        timesheet.thursday_hours || 0,
        timesheet.friday_hours || 0,
        timesheet.saturday_hours || 0,
        timesheet.sunday_hours || 0,
        0, 0, 0, 0, 0, 0, 0 // Second week defaults to 0
      ];
    }
    return Array(14).fill(0);
  });

  // Initialize hours state correctly when timesheet data becomes available
  useEffect(() => {
    if (timesheet && !isBiWeekly) {
      setHours([
        timesheet.monday_hours || 0,
        timesheet.tuesday_hours || 0,
        timesheet.wednesday_hours || 0,
        timesheet.thursday_hours || 0,
        timesheet.friday_hours || 0,
        timesheet.saturday_hours || 0,
        timesheet.sunday_hours || 0,
      ]);
    }
  }, [timesheet, isBiWeekly]);

  // Expenses state
  const [expenses, setExpenses] = useState({
    gas: timesheet.gas_expense || 0,
    perDiem: timesheet.per_diem || 0,
    additional: timesheet.additional_expense || 0,
  });

  // Tax settings
  const [includeTaxes, setIncludeTaxes] = useState(timesheet.include_taxes !== false);
  const [taxPercentage, setTaxPercentage] = useState(timesheet.tax_percentage || taxRate);

  // Notes state (filter out bi-weekly JSON from display)
  const [notesValue, setNotesValue] = useState(() => {
    if (!timesheet.notes) return '';
    
    // Remove bi-weekly JSON from display
    const notes = timesheet.notes.replace(/__biweekly_json__=.*?__end_biweekly_json__/g, '').trim();
    return notes;
  });

  const handleInputChange = (index: number, value: number) => {
    const newHours = [...hours];
    newHours[index] = value;
    setHours(newHours);
  };

  const handleExpenseChange = (field: string, value: number) => {
    setExpenses(prev => ({ ...prev, [field]: value }));
  };

  // Calculate totals
  const calculatedTotalHours = isBiWeekly 
    ? hours14.reduce((sum, h) => sum + (h || 0), 0)
    : hours.reduce((sum, h) => sum + (h || 0), 0);

  const displayTotalHours = timesheet.total_hours || calculatedTotalHours;
  const totalHoursDiscrepancy = Math.abs(displayTotalHours - calculatedTotalHours);

  const totalExpenses = expenses.gas + expenses.perDiem + expenses.additional;
  const grossPay = (calculatedTotalHours * (timesheet.hourly_rate || 0)) + totalExpenses;

  // Payroll calculations for employees
  const payrollCalculations = useMemo(() => {
    if (!isPayrollEmployee || !includeTaxes) return null;

    const cpp = grossPay * 0.0595; // 2024 CPP rate
    const ei = grossPay * 0.0229; // 2024 EI rate
    const federalTax = grossPay * 0.15; // Simplified federal tax
    const provincialTax = grossPay * (taxPercentage / 100 - 0.15); // Provincial portion

    const netPay = grossPay - cpp - ei - federalTax - provincialTax;

    return {
      cpp,
      ei,
      federalTax,
      provincialTax,
      netPay
    };
  }, [isPayrollEmployee, includeTaxes, grossPay, taxPercentage]);

  const totalPay = payrollCalculations ? payrollCalculations.netPay : grossPay;

  const handleSave = () => {
    const updatedData: any = {
      ...timesheet,
      total_hours: calculatedTotalHours,
      gas_expense: expenses.gas,
      per_diem: expenses.perDiem,
      additional_expense: expenses.additional,
      include_taxes: includeTaxes,
      tax_percentage: taxPercentage,
      notes: notesValue,
      gross_pay: grossPay,
    };

    // Handle hours differently for bi-weekly vs weekly
    if (isBiWeekly) {
      // Embed bi-weekly data as JSON in notes
      const biWeeklyData = {
        days: hours14.map((hours, index) => ({
          date: format(addDays(periodStart, index), 'yyyy-MM-dd'),
          hours: hours || 0
        }))
      };
      
      const base64Data = btoa(JSON.stringify(biWeeklyData));
      
      // Clean existing bi-weekly JSON and add new one
      let cleanNotes = notesValue.replace(/__biweekly_json__=.*?__end_biweekly_json__/g, '').trim();
      if (cleanNotes && !cleanNotes.endsWith('\n')) cleanNotes += '\n';
      
      updatedData.notes = `${cleanNotes}__biweekly_json__=${base64Data}__end_biweekly_json__`;
      
      // Also update individual day columns with first week data
      updatedData.monday_hours = hours14[0] || 0;
      updatedData.tuesday_hours = hours14[1] || 0;
      updatedData.wednesday_hours = hours14[2] || 0;
      updatedData.thursday_hours = hours14[3] || 0;
      updatedData.friday_hours = hours14[4] || 0;
      updatedData.saturday_hours = hours14[5] || 0;
      updatedData.sunday_hours = hours14[6] || 0;
    } else {
      // Weekly timesheet - update individual day columns
      updatedData.monday_hours = hours[0] || 0;
      updatedData.tuesday_hours = hours[1] || 0;
      updatedData.wednesday_hours = hours[2] || 0;
      updatedData.thursday_hours = hours[3] || 0;
      updatedData.friday_hours = hours[4] || 0;
      updatedData.saturday_hours = hours[5] || 0;
      updatedData.sunday_hours = hours[6] || 0;
    }

    onSave(updatedData, timesheet);
  };

  // Get display name
  const displayName = timesheet.user_profiles 
    ? `${timesheet.user_profiles.first_name} ${timesheet.user_profiles.last_name}`
    : 'Unknown Employee';

  if (settingsLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div>Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Edit Timesheet - {displayName}
          </DialogTitle>
        </DialogHeader>

        {!canEditTimesheets && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to edit this timesheet.
            </AlertDescription>
          </Alert>
        )}

        {/* Always visible summary card */}
        <TimesheetSummaryCard
          periodStart={periodStart}
          periodEnd={periodEnd}
          totalHours={displayTotalHours}
          calculatedHours={calculatedTotalHours}
          grossPay={grossPay}
          totalPay={totalPay}
          hasDiscrepancy={totalHoursDiscrepancy > 0.01}
          dateFixed={true} // Since we fixed the dates in migration
        />

        <Tabs defaultValue="hours" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="expenses">Expenses & Tax</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="space-y-6">
            {isBiWeekly ? (
              <BiWeeklyHoursEditor
                week1Days={week1Days}
                week2Days={week2Days}
                week1Values={hours14.slice(0, 7)}
                week2Values={hours14.slice(7, 14)}
                onWeek1Change={(index, value) => {
                  const newHours = [...hours14];
                  newHours[index] = value;
                  setHours14(newHours);
                }}
                onWeek2Change={(index, value) => {
                  const newHours = [...hours14];
                  newHours[index + 7] = value;
                  setHours14(newHours);
                }}
                disabled={!canEditTimesheets}
              />
            ) : (
              <div className="max-w-2xl mx-auto">
                <WeeklyHoursEditor
                  days={allDays}
                  values={hours}
                  onChange={handleInputChange}
                  disabled={!canEditTimesheets}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="space-y-6">
              {/* Expenses */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="gas-expense">Gas Expense</Label>
                    <Input
                      id="gas-expense"
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenses.gas || ''}
                      onChange={(e) => handleExpenseChange('gas', parseFloat(e.target.value) || 0)}
                      disabled={!canEditTimesheets}
                    />
                  </div>
                  <div>
                    <Label htmlFor="per-diem">Per Diem</Label>
                    <Input
                      id="per-diem"
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenses.perDiem || ''}
                      onChange={(e) => handleExpenseChange('perDiem', parseFloat(e.target.value) || 0)}
                      disabled={!canEditTimesheets}
                    />
                  </div>
                  <div>
                    <Label htmlFor="additional-expense">Additional Expense</Label>
                    <Input
                      id="additional-expense"
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenses.additional || ''}
                      onChange={(e) => handleExpenseChange('additional', parseFloat(e.target.value) || 0)}
                      disabled={!canEditTimesheets}
                    />
                  </div>
                </div>
              </div>

              {/* Payroll Deductions/Tax Control Section - Only for employees */}
              {isPayrollEmployee && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tax & Payroll</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Tax Control</h4>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include-taxes"
                          checked={includeTaxes}
                          onCheckedChange={setIncludeTaxes}
                          disabled={!canEditTimesheets}
                        />
                        <Label htmlFor="include-taxes">Include taxes in calculation</Label>
                      </div>
                      
                      {includeTaxes && (
                        <div className="space-y-2">
                          <Label htmlFor="tax-percentage">Tax Percentage</Label>
                          <Input
                            id="tax-percentage"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={taxPercentage}
                            onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                            disabled={!canEditTimesheets}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Payroll Summary</h4>
                      <div className="space-y-2 text-sm bg-muted/50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>Gross Pay:</span>
                          <span className="font-medium">${grossPay.toFixed(2)}</span>
                        </div>
                        
                        {payrollCalculations && (
                          <>
                            <div className="flex justify-between">
                              <span>Federal Tax:</span>
                              <span className="font-medium text-red-600">-${payrollCalculations.federalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Provincial Tax:</span>
                              <span className="font-medium text-red-600">-${payrollCalculations.provincialTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>CPP:</span>
                              <span className="font-medium text-red-600">-${payrollCalculations.cpp.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>EI:</span>
                              <span className="font-medium text-red-600">-${payrollCalculations.ei.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-semibold">
                              <span>Net Pay:</span>
                              <span className="text-green-600">${payrollCalculations.netPay.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes & Comments</Label>
                  <Textarea
                    id="notes"
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={6}
                    disabled={!canEditTimesheets}
                    placeholder="Enter any additional notes, comments, or details about this timesheet..."
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {canEditTimesheets && (
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetEditModal;