
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimesheetEditModalProps {
  timesheet: any;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

const TimesheetEditModal: React.FC<TimesheetEditModalProps> = ({
  timesheet,
  onClose,
  onSave,
  isSaving
}) => {
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

  const totalHours = Object.entries(formData)
    .filter(([key]) => key.includes('_hours'))
    .reduce((sum, [, hours]) => sum + Number(hours), 0);

  const totalPay = (totalHours * (timesheet.hourly_rate || 0)) + Number(formData.additional_expense);

  const handleSave = () => {
    onSave({
      ...formData,
      total_hours: totalHours,
      gross_pay: totalPay
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: Number(value) || 0
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Timesheet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(formData).filter(([key]) => key.includes('_hours')).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-2">
              <Label className="w-20 capitalize">
                {day.replace('_hours', '')}:
              </Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hours}
                onChange={(e) => handleInputChange(day, e.target.value)}
              />
            </div>
          ))}
          
          <div className="flex items-center gap-2">
            <Label className="w-20">
              Additional Expenses ($):
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.additional_expense}
              onChange={(e) => handleInputChange('additional_expense', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Hours:</span>
              <span className="font-mono">{totalHours.toFixed(2)}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hourly Rate:</span>
              <span className="font-mono">${(timesheet.hourly_rate || 0).toFixed(2)}/hr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Additional Expenses:</span>
              <span className="font-mono">${formData.additional_expense.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Pay:</span>
              <span className="font-mono">${totalPay.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetEditModal;
