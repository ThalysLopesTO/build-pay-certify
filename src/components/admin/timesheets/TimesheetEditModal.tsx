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
import { getDaysForPeriod, getBiWeeklyDays, getWeekdayIndex, getCurrentPeriod } from '@/lib/time/periods';
import { addDays, format } from 'date-fns';
import { useMemo } from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { calculatePayrollTotals } from '@/utils/taxCalculations';

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
    if (isBiWeekly) {
      const { week1Days, week2Days } = getBiWeeklyDays({ start: periodStart, end: periodEnd });
      return {
        allDays: [...week1Days, ...week2Days],
        week1Days,
        week2Days
      };
    }
    
    const all = getDaysForPeriod({ start: periodStart, end: periodEnd });
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
  const [taxIncluded, setTaxIncluded] = useState(false);

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
  const workerType = timesheet.worker_type || 'employee';
  
  // Calculate payroll totals with proper tax handling
  const payrollCalculation = useMemo(() => {
    return calculatePayrollTotals(
      calculatedTotalHours,
      timesheet.hourly_rate || 0,
      totalExpenses,
      workerType,
      taxPercentage,
      taxIncluded
    );
  }, [calculatedTotalHours, timesheet.hourly_rate, totalExpenses, workerType, taxPercentage, taxIncluded]);

  const { grossPay, netPay, taxAmount, breakdown } = payrollCalculation;

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
          totalPay={netPay}
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

              {/* Tax Controls for Subcontractors */}
              {workerType === 'subcontractor' && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tax-included" className="text-sm font-medium">
                        HST Included in Rate
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Toggle if HST is already included in the hourly rate
                      </p>
                    </div>
                    <Switch
                      id="tax-included"
                      checked={taxIncluded}
                      onCheckedChange={setTaxIncluded}
                      disabled={!canEditTimesheets}
                    />
                  </div>
                </div>
              )}
              
              {/* Payroll Summary */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-3">
                  {workerType === 'employee' ? 'Payroll Summary' : 'Payment Summary'}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Gross Pay:</span>
                  <span className="font-medium">${grossPay.toFixed(2)}</span>
                  
                  {workerType === 'employee' ? (
                    <>
                      {breakdown.cpp && (
                        <>
                          <span>CPP:</span>
                          <span className="text-destructive">-${breakdown.cpp.toFixed(2)}</span>
                        </>
                      )}
                      {breakdown.ei && (
                        <>
                          <span>EI:</span>
                          <span className="text-destructive">-${breakdown.ei.toFixed(2)}</span>
                        </>
                      )}
                      {breakdown.federalTax && (
                        <>
                          <span>Federal Tax:</span>
                          <span className="text-destructive">-${breakdown.federalTax.toFixed(2)}</span>
                        </>
                      )}
                      {breakdown.provincialTax && (
                        <>
                          <span>Provincial Tax:</span>
                          <span className="text-destructive">-${breakdown.provincialTax.toFixed(2)}</span>
                        </>
                      )}
                      <span className="font-medium border-t pt-1">Net Pay:</span>
                      <span className="font-medium text-primary border-t pt-1">${netPay.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <span>HST ({taxPercentage}%):</span>
                      <span className={taxIncluded ? "text-destructive" : "text-primary"}>
                        {taxIncluded ? '-' : '+'}${taxAmount.toFixed(2)}
                      </span>
                      <span className="font-medium border-t pt-1">Total Pay:</span>
                      <span className="font-medium text-primary border-t pt-1">${netPay.toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>
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