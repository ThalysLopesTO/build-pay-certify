/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format, addDays, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useWorkWeek } from '@/hooks/useWorkWeek';
import { calculateTax } from '@/utils/taxCalculations';

interface CreateManualTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

interface TimesheetFormData {
  employeeName: string;
  workerType: 'employee' | 'subcontractor';
  jobsiteId: string;
  selectedDate: Date | undefined;
  mondayHours: string;
  tuesdayHours: string;
  wednesdayHours: string;
  thursdayHours: string;
  fridayHours: string;
  saturdayHours: string;
  sundayHours: string;
  mondayHours2?: string;
  tuesdayHours2?: string;
  wednesdayHours2?: string;
  thursdayHours2?: string;
  fridayHours2?: string;
  saturdayHours2?: string;
  sundayHours2?: string;
  hourlyRate: number;
  additionalExpense: number;
  taxIncluded: boolean;
  // Employee-specific deduction fields
  incomeTaxRate: number;
  cppRate: number;
  eiRate: number;
  notes: string;
  frequency?: 'weekly' | 'bi-weekly'; // New field for timesheet frequency
}

const CreateManualTimesheetModal: React.FC<CreateManualTimesheetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving
}) => {
  const { data: jobsites = [] } = useActiveJobsites();
  const { settings } = useCompanySettings();
  // const workWeeks = useWorkWeek();

  const [formData, setFormData] = useState<TimesheetFormData>({
    employeeName: '',
    workerType: 'subcontractor',
    jobsiteId: '',
    selectedDate: undefined,
    mondayHours: '',
    tuesdayHours: '',
    wednesdayHours: '',
    thursdayHours: '',
    fridayHours: '',
    saturdayHours: '',
    sundayHours: '',
    hourlyRate: 25,
    additionalExpense: 0,
    taxIncluded: false,
    incomeTaxRate: 12, // Default 12%
    cppRate: 5.95, // Default 5.95%
    eiRate: 1.63, // Default 1.63%
    notes: '',
  });

  // Helper to parse hours from string, treating empty as 0
  const getHours = (val: string | undefined) => parseFloat(val || '0') || 0;

  // Calculate totals
  const totalHours =
    getHours(formData.mondayHours) +
    getHours(formData.tuesdayHours) +
    getHours(formData.wednesdayHours) +
    getHours(formData.thursdayHours) +
    getHours(formData.fridayHours) +
    getHours(formData.saturdayHours) +
    getHours(formData.sundayHours) +
    (formData.frequency === "bi-weekly"
      ? getHours(formData.mondayHours2) +
        getHours(formData.tuesdayHours2) +
        getHours(formData.wednesdayHours2) +
        getHours(formData.thursdayHours2) +
        getHours(formData.fridayHours2) +
        getHours(formData.saturdayHours2) +
        getHours(formData.sundayHours2)
      : 0);

  const grossPay = (totalHours * formData.hourlyRate) + formData.additionalExpense;

  const tax = calculateTax({
    tax_included: formData.taxIncluded,
    type: formData.workerType,
    tax_percentage: settings?.tax_percentage,
    gross_pay: grossPay,
  })

  const calculatedTax = tax.calculatedTax;
  const deductions = tax.deductions;
  const totalPay = tax.totalPay;

  const handleInputChange = (field: keyof TimesheetFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHoursChange = (day: string, value: string) => {
    handleInputChange(day as keyof TimesheetFormData, value);
  };

  const handleDateSelect = (date: Date | undefined) => {
    handleInputChange('selectedDate', date);
  };

  const handleSave = () => {
    if (!formData.employeeName.trim() || !formData.jobsiteId || !formData.selectedDate) {
      return;
    }

    // Use the selected date directly as the week start (no automatic adjustment for manual timesheets)
    const weekStartDateString = format(formData.selectedDate, 'yyyy-MM-dd');

    const tax = calculateTax({
      tax_included: formData.taxIncluded,
      type: formData.workerType,
      tax_percentage: settings?.tax_percentage,
      gross_pay: grossPay,
    })

    // Build periods based on the actual days in the selected week
    const buildWeekDays = (weekNum: number) => {
      const days = [];
      const fieldNames = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      for (let i = 0; i < 7; i++) {
        const weekOffset = (weekNum - 1) * 7;
        const currentDate = addDays(formData.selectedDate!, weekOffset + i);
        const dayIndex = getDay(currentDate); // 0 = Sunday, 6 = Saturday
        const fieldName = weekNum === 1 ? fieldNames[dayIndex] : `${fieldNames[dayIndex]}2`;
        const dayKey = dayKeys[dayIndex];
        
        const hourValue = parseFloat(String(formData[fieldName as keyof TimesheetFormData]) || '0') || 0;
        days.push({ [dayKey]: hourValue });
      }
      return days;
    };

    const periods = [{
      week: "week1",
      days: buildWeekDays(1)
    }];

    if (formData.frequency === 'bi-weekly') {
      periods.push({
        week: "week2",
        days: buildWeekDays(2),
      });
    }

    const timesheetData = {
      manual_entry_name: formData.employeeName.trim(),
      is_manual_entry: true,
      worker_type: formData.workerType,
      jobsite_id: formData.jobsiteId,
      week_start_date: weekStartDateString,
      hourly_rate: formData.hourlyRate,
      additional_expense: formData.additionalExpense,
      tax_included: formData.taxIncluded,
      tax: calculatedTax,
      income_tax: tax.incomeTax,
      cpp: tax.cpp,
      ei: tax.ei,
      income_tax_rate: formData.incomeTaxRate,
      cpp_rate: formData.cppRate,
      ei_rate: formData.eiRate,
      notes: formData.notes || null,
      status: 'pending',
      gross_pay: grossPay,
      total_pay: totalPay,
      total_hours: totalHours,
      hours_pay: totalHours * formData.hourlyRate,
      periods,
    };
    onSave(timesheetData);
  };

  const resetForm = () => {
    setFormData({
      employeeName: '',
      workerType: 'subcontractor',
      jobsiteId: '',
      selectedDate: undefined,
      mondayHours: '',
      tuesdayHours: '',
      wednesdayHours: '',
      thursdayHours: '',
      fridayHours: '',
      saturdayHours: '',
      sundayHours: '',
      hourlyRate: 25,
      additionalExpense: 0,
      taxIncluded: false,
      incomeTaxRate: 12,
      cppRate: 5.95,
      eiRate: 1.63,
      notes: ''
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Create Manual Timesheet
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Summary Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            {formData.workerType === 'subcontractor' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-600">{totalHours.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Pay</p>
                  <p className="text-2xl font-bold text-green-600">${grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tax (13%)</p>
                  <p className="text-2xl font-bold text-orange-600">${calculatedTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pay</p>
                  <p className="text-2xl font-bold text-purple-600">${totalPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Pay</p>
                  <p className="text-2xl font-bold text-green-600">${grossPay.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Deductions</p>
                  <p className="text-2xl font-bold text-red-600">${deductions.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Pay</p>
                  <p className="text-2xl font-bold text-purple-600">${totalPay.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workerType">Worker Type*</Label>
              <Select value={formData.workerType} onValueChange={(value: 'employee' | 'subcontractor') => handleInputChange('workerType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subcontractor">Subcontractor (13% HST optional)</SelectItem>
                  <SelectItem value="employee">Employee (Payroll — with deductions)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Full Name*</Label>
              <Input
                id="employeeName"
                type="text"
                placeholder="Enter full name"
                value={formData.employeeName}
                onChange={(e) => handleInputChange('employeeName', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobsite">Jobsite*</Label>
              <Select value={formData.jobsiteId} onValueChange={(value) => handleInputChange('jobsiteId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select jobsite" />
                </SelectTrigger>
                <SelectContent>
                  {jobsites.map((jobsite) => (
                    <SelectItem key={jobsite.id} value={jobsite.id}>
                      {jobsite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateSelect">Week Starting Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.selectedDate ? (
                      format(formData.selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25.00"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workerType">Frequency*</Label>
              <Select value={formData.frequency} onValueChange={(value: 'weekly' | 'bi-weekly') => handleInputChange('frequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weekly Hours */}
          <div className="space-y-4">
            <hr />
            <h3 className="font-bold text-gray-900">
              {formData.frequency === 'bi-weekly' ? 'Bi-Weekly Hours' : 'Weekly Hours'}
            </h3>

            {formData.selectedDate ? (
              Array.from({ length: formData.frequency === 'bi-weekly' ? 2 : 1 }, (_, i) => i + 1).map((weekNum) => (
                <div key={weekNum} className="space-y-3 border p-4 rounded-lg">
                  {formData.frequency === 'bi-weekly' && (
                    <p className="text-sm font-bold text-gray-700">Week {weekNum}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {(() => {
                      const fieldNames = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];

                      const orderedDays = [];
                      for (let i = 0; i < 7; i++) {
                        // Calculate the actual date for this day slot based on selected week start
                        const weekOffset = (weekNum - 1) * 7;
                        const currentDate = addDays(formData.selectedDate!, weekOffset + i);
                        
                        // Get the day of week for this date (0 = Sunday, 6 = Saturday)
                        const dayIndex = getDay(currentDate);
                        
                        orderedDays.push({
                          day: weekNum === 1 ? fieldNames[dayIndex] : `${fieldNames[dayIndex]}2`,
                          dayLabel: format(currentDate, "EEE"),      // "Sun"
                          dateLabel: format(currentDate, "MMM d")    // "Jan 4"
                        });
                      }
                      return orderedDays;
                    })().map(({ day, dayLabel, dateLabel }) => (
                      <div key={day} className="space-y-1">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-700">{dayLabel}</span>
                          <span className="text-xs text-muted-foreground">{dateLabel}</span>
                        </div>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          placeholder="0"
                          value={(formData[day as keyof TimesheetFormData] as string) ?? ''}
                          onChange={(e) => handleHoursChange(day, e.target.value)}
                          className="text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                Please select a Week Starting Date above to enter hours
              </div>
            )}
            <hr />
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="additionalExpense">Additional Expenses</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="additionalExpense"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.additionalExpense}
                  onChange={(e) => handleInputChange('additionalExpense', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>

            {formData.workerType === 'subcontractor' && (
              <div className="space-y-3">
                <Label>Tax Control</Label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Switch
                    checked={formData.taxIncluded}
                    onCheckedChange={(checked) => handleInputChange('taxIncluded', checked)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Include 13% HST</p>
                    <p className="text-xs text-gray-600">
                      {formData.taxIncluded ? `+$${calculatedTax.toFixed(2)} HST` : 'No HST applied'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {formData.workerType === 'employee' && (
              <div className="space-y-3">
                <Label>Payroll Deductions (Editable)</Label>
                <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">Deduction Rates:</p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Income Tax (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.incomeTaxRate}
                        onChange={(e) => handleInputChange('incomeTaxRate', parseFloat(e.target.value) || 0)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="">CPP (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.cppRate}
                        onChange={(e) => handleInputChange('cppRate', parseFloat(e.target.value) || 0)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>EI (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.eiRate}
                        onChange={(e) => handleInputChange('eiRate', parseFloat(e.target.value) || 0)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 border-t pt-2">
                    <div className="flex justify-between">
                      <span>Income Tax ({formData.incomeTaxRate}%):</span>
                      <span>${(grossPay * (formData.incomeTaxRate / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPP ({formData.cppRate}%):</span>
                      <span>${(grossPay * (formData.cppRate / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EI ({formData.eiRate}%):</span>
                      <span>${(grossPay * (formData.eiRate / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-900 pt-2 border-t">
                      <span>Total Deductions:</span>
                      <span>${deductions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              placeholder="Add any additional notes or comments..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.employeeName.trim() || !formData.jobsiteId || !formData.selectedDate || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? 'Creating...' : 'Create Timesheet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateManualTimesheetModal;