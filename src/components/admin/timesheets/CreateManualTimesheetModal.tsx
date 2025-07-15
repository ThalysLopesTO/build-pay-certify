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
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useJobsites } from '@/hooks/useJobsites';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useWorkWeek } from '@/hooks/useWorkWeek';

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
  mondayHours: number;
  tuesdayHours: number;
  wednesdayHours: number;
  thursdayHours: number;
  fridayHours: number;
  saturdayHours: number;
  sundayHours: number;
  hourlyRate: number;
  additionalExpense: number;
  taxIncluded: boolean;
  notes: string;
}

const CreateManualTimesheetModal: React.FC<CreateManualTimesheetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving
}) => {
  const { data: jobsites = [] } = useJobsites();
  const { settings } = useCompanySettings();
  const workWeeks = useWorkWeek();
  
  const [formData, setFormData] = useState<TimesheetFormData>({
    employeeName: '',
    workerType: 'subcontractor',
    jobsiteId: '',
    selectedDate: undefined,
    mondayHours: 0,
    tuesdayHours: 0,
    wednesdayHours: 0,
    thursdayHours: 0,
    fridayHours: 0,
    saturdayHours: 0,
    sundayHours: 0,
    hourlyRate: 25,
    additionalExpense: 0,
    taxIncluded: false,
    notes: ''
  });

  // Calculate totals
  const totalHours = formData.mondayHours + formData.tuesdayHours + formData.wednesdayHours + 
                    formData.thursdayHours + formData.fridayHours + formData.saturdayHours + formData.sundayHours;
  
  const grossPay = (totalHours * formData.hourlyRate) + formData.additionalExpense;
  
  // Calculate based on worker type
  let calculatedTax = 0;
  let deductions = 0;
  let totalPay = grossPay;
  
  if (formData.workerType === 'subcontractor') {
    const taxRate = settings?.tax_percentage || 13;
    calculatedTax = formData.taxIncluded ? (grossPay * taxRate / 100) : 0;
    totalPay = grossPay + calculatedTax;
  } else {
    // Employee: calculate deductions
    const incomeTax = grossPay * 0.12; // 12%
    const cpp = grossPay * 0.0595; // 5.95%
    const ei = grossPay * 0.0163; // 1.63%
    deductions = incomeTax + cpp + ei;
    totalPay = grossPay - deductions;
  }

  const handleInputChange = (field: keyof TimesheetFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHoursChange = (day: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    handleInputChange(day as keyof TimesheetFormData, numValue);
  };

  const handleDateSelect = (date: Date | undefined) => {
    handleInputChange('selectedDate', date);
  };

  const handleSave = () => {
    if (!formData.employeeName.trim() || !formData.jobsiteId || !formData.selectedDate) {
      return;
    }

    // Get the Monday of the selected week
    const weekStart = startOfWeek(formData.selectedDate, { weekStartsOn: 1 });
    const weekStartDateString = format(weekStart, 'yyyy-MM-dd');

    const timesheetData = {
      manual_entry_name: formData.employeeName.trim(),
      is_manual_entry: true,
      worker_type: formData.workerType,
      jobsite_id: formData.jobsiteId,
      week_start_date: weekStartDateString,
      monday_hours: formData.mondayHours,
      tuesday_hours: formData.tuesdayHours,
      wednesday_hours: formData.wednesdayHours,
      thursday_hours: formData.thursdayHours,
      friday_hours: formData.fridayHours,
      saturday_hours: formData.saturdayHours,
      sunday_hours: formData.sundayHours,
      hourly_rate: formData.hourlyRate,
      additional_expense: formData.additionalExpense,
      tax_included: formData.taxIncluded,
      calculated_tax: calculatedTax,
      notes: formData.notes || null,
      status: 'pending'
    };

    onSave(timesheetData);
  };

  const resetForm = () => {
    setFormData({
      employeeName: '',
      workerType: 'subcontractor',
      jobsiteId: '',
      selectedDate: undefined,
      mondayHours: 0,
      tuesdayHours: 0,
      wednesdayHours: 0,
      thursdayHours: 0,
      fridayHours: 0,
      saturdayHours: 0,
      sundayHours: 0,
      hourlyRate: 25,
      additionalExpense: 0,
      taxIncluded: false,
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
                  <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Pay</p>
                  <p className="text-2xl font-bold text-green-600">${grossPay.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tax (13%)</p>
                  <p className="text-2xl font-bold text-orange-600">${calculatedTax.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pay</p>
                  <p className="text-2xl font-bold text-purple-600">${totalPay.toFixed(2)}</p>
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
              <Label htmlFor="workerType">Worker Type *</Label>
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
              <Label htmlFor="employeeName">Employee Full Name *</Label>
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
              <Label htmlFor="jobsite">Jobsite *</Label>
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
              <Label htmlFor="dateSelect">Week Starting Date *</Label>
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
                      format(startOfWeek(formData.selectedDate, { weekStartsOn: 1 }), "PPP")
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
          </div>

          {/* Weekly Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Weekly Hours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {(() => {
                // Get the week ending day from company settings (0=Sunday, 1=Monday, etc.)
                const weekEndingDay = settings?.week_ending_day ?? 0;
                
                // Calculate the week start day (day after the ending day)
                const weekStartDay = (weekEndingDay + 1) % 7;
                
                // Base day names and field names
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const fieldNames = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];
                
                // Create ordered days based on company's week start
                const orderedDays = [];
                for (let i = 0; i < 7; i++) {
                  const dayIndex = (weekStartDay + i) % 7;
                  orderedDays.push({
                    day: fieldNames[dayIndex],
                    label: dayNames[dayIndex].substring(0, 3)
                  });
                }
                
                return orderedDays;
              })().map(({ day, label }) => (
                <div key={day} className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">{label}</Label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    placeholder="0"
                    value={formData[day as keyof TimesheetFormData] as number}
                    onChange={(e) => handleHoursChange(day, e.target.value)}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
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

            {formData.workerType === 'subcontractor' ? (
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
            ) : (
              <div className="space-y-3">
                <Label>Payroll Deductions</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Automatic Deductions Applied:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Income Tax (12%):</span>
                      <span>${(grossPay * 0.12).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPP (5.95%):</span>
                      <span>${(grossPay * 0.0595).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EI (1.63%):</span>
                      <span>${(grossPay * 0.0163).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-900 pt-1 border-t">
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