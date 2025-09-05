/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { calculatePayrollTotals, calculateTax } from '@/utils/taxCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimesheetEditModalProps {
  timesheet: any;
  onClose: () => void;
  onSave: (data: any, originalData: any) => void;
  isSaving: boolean;
}

type DayEntry = {
  [day: string]: number; // e.g. { "monday": 3 }
};

type WeekPeriod = {
  week: string; // e.g. "week1"
  days: DayEntry[];
};

type Timesheet = WeekPeriod[];

const TimesheetEditModal: React.FC<TimesheetEditModalProps> = ({
  timesheet,
  onClose,
  onSave,
  isSaving
}) => {
  const { user } = useAuth();
  // const { settings: companySettings, isLoading: settingsLoading } = useCompanySettings();
  const [newTimesheet, setNewTimesheet] = useState<Timesheet>(timesheet.periods || []);

  // Permission check - only admin, super_admin, and management can edit timesheets
  const canEditTimesheets = user?.role && ['admin', 'super_admin', 'management'].includes(user.role);
  const isBiWeekly = timesheet?.periods.length === 2;

  // Calculate the correct period dates using fixed logic
  const { periodStart, periodEnd } = useMemo(() => {
    if (!timesheet?.week_start_date || !timesheet?.periods?.length) {
      return { periodStart: new Date(), periodEnd: new Date() };
    }

    const start = new Date(timesheet.week_start_date);
    const totalDays = timesheet.periods.length * 7; // each period = 7 days
    const end = addDays(start, totalDays - 1);

    return { periodStart: start, periodEnd: end };
  }, [timesheet.week_start_date, timesheet.periods]);

  // Expenses state
  const [expenses, setExpenses] = useState({
    gas: timesheet.gas_expense || 0,
    perDiem: timesheet.per_diem || 0,
    additional: timesheet.additional_expense || 0,
  });

  
  const [taxIncluded, setTaxIncluded] = useState(timesheet.tax_included || false);
  const [notesValue, setNotesValue] = useState(timesheet.notes || '');
  const [additionalExpense, setAdditionalExpense] = useState(timesheet.additional_expense || 0);

  const handleExpenseChange = (field: string, value: number) => {
    setExpenses(prev => ({ ...prev, [field]: value }));
  };

  const recordedTotalHours = timesheet.total_hours || 0;

  const calculatedTotalHours = newTimesheet.reduce((sum: number, week: any) => {
    return sum + week.days.reduce((s: number, d: any) => s + (Object.values(d)[0] as number || 0), 0);
  }, 0);

  const totalHoursDiscrepancy = Math.abs(recordedTotalHours - calculatedTotalHours);

  // const totalExpenses = expenses.gas + expenses.perDiem + expenses.additional;
  const workerType = timesheet.worker_type || 'employee';

  const calculatedGrossPay = (calculatedTotalHours * timesheet.hourly_rate) + additionalExpense;

  const taxPercentage = 13; // Default tax percentage for subcontractors

  const tax = calculateTax({
    type: timesheet.worker_type || 'employee',
    tax_percentage: taxPercentage,
    gross_pay: calculatedGrossPay,
    tax_included: taxIncluded,
    income_tax_rate: timesheet.income_tax_rate,
    cpp_rate: timesheet.cpp_rate,
    ei_rate: timesheet.ei_rate
  })

  const handleSave = () => {
    const withoutJobsite = { ...timesheet };
    delete withoutJobsite.jobsite; 

    const updatedData: any = {
      ...withoutJobsite,
      periods: newTimesheet,                  
      total_hours: calculatedTotalHours,      
      gross_pay: calculatedGrossPay,          
      // gas_expense: expenses.gas,
      // per_diem: expenses.perDiem,
      // tax_percentage: taxPercentage,
      additional_expense: additionalExpense,
      tax_included: taxIncluded,
      notes: notesValue,
      total_pay: tax.totalPay,
      income_tax: tax.incomeTax,
      tax: tax.calculatedTax,
      cpp: tax.cpp,
      ei: tax.ei,
      hours_pay: calculatedTotalHours * timesheet.hourly_rate,
    };
    onSave(updatedData, timesheet);
  };

  // Get display name
  const displayName = timesheet.employee_name;

  // if (settingsLoading) {
  //   return (
  //     <Dialog open={true} onOpenChange={onClose}>
  //       <DialogContent>
  //         <div>Loading...</div>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // }

  const start = timesheet.week_start_date ? new Date(timesheet.week_start_date) : new Date();

  const handleChange = (weekIndex: number, dayIndex: number, value: number) => {
    setNewTimesheet((prev) => {
      const updated = [...prev];
      updated[weekIndex] = {
        ...updated[weekIndex],
        days: updated[weekIndex].days.map((d: any, i: number) =>
          i === dayIndex ? { [Object.keys(d)[0]]: value } : d
        ),
      };
      return updated;
    });
  };

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
          totalHours={calculatedTotalHours}
          calculatedHours={totalHoursDiscrepancy}
          grossPay={calculatedGrossPay}
          totalPay={tax.totalPay}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {newTimesheet.map((w: any, i) => {
                const totalWeek = w.days.reduce((s, d) => {
                  const hours = Object.values(d)[0] as number;
                  return s + (hours || 0);
                }, 0);

                return (
                  <Card key={`w-${i}`} className="border-2 border-primary/20">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Week {i + 1}</span>
                        <span className="text-sm font-medium text-primary">
                          {totalWeek}h total
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-3">
                        {w.days.map((day, idx) => {
                          const c = addDays(start, i * 7 + idx); // ✅ correct day offset
                          const label = format(c, 'EEEE');        // Mon, Tue, ...
                          const date = format(c, 'MMM dd');      // Jan 01

                          const hours = Object.values(day)[0] as number;

                          return (
                            <div key={`w${i}-d${idx}`} className="flex items-center gap-3">
                              <Label className="w-32 text-sm font-medium">
                                {date}
                              </Label>
                              <Label className="w-16 text-xs text-muted-foreground">
                                {label}
                              </Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={24}
                                step={0.5}
                                value={hours === 0 ? "" : hours || ""}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  handleChange(i, idx, Number(e.target.value) || 0)
                                }
                                className="h-9 w-20"
                              />
                              <span className="text-xs text-muted-foreground w-8">hrs</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
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
                      value={additionalExpense}
                      onChange={(e) => setAdditionalExpense(Number(e.target.value) || 0)}
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
                  <span className="font-medium">${calculatedGrossPay.toFixed(2)}</span>

                  {workerType === 'employee' ? (
                    <>
                      {tax.cpp && (
                        <>
                          <span>CPP:</span>
                          <span className="text-destructive">-${tax.cpp.toFixed(2)}</span>
                        </>
                      )}
                      {tax.ei && (
                        <>
                          <span>EI:</span>
                          <span className="text-destructive">-${tax.ei.toFixed(2)}</span>
                        </>
                      )}
                      <span className="font-medium border-t pt-1">Net Pay:</span>
                      <span className="font-medium text-primary border-t pt-1">${tax.totalPay.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <span>HST ({taxPercentage}%):</span>
                      <span className={!taxIncluded ? "text-destructive" : "text-primary"}>
                        {taxIncluded ? '+' : '-'}${tax.calculatedTax.toFixed(2)}
                      </span>
                      <span className="font-medium border-t pt-1">Total Pay:</span>
                      <span className="font-medium text-primary border-t pt-1">${tax.totalPay.toFixed(2)}</span>
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