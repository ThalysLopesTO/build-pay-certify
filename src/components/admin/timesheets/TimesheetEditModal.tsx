
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheetUpdate } from '@/hooks/useTimesheetUpdate';

interface TimesheetEditModalProps {
  timesheet: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  jobsites: any[];
}

const TimesheetEditModal: React.FC<TimesheetEditModalProps> = ({
  timesheet,
  isOpen,
  onClose,
  onSave,
  jobsites
}) => {
  const [formData, setFormData] = useState({
    jobsite_id: '',
    monday_hours: 0,
    tuesday_hours: 0,
    wednesday_hours: 0,
    thursday_hours: 0,
    friday_hours: 0,
    saturday_hours: 0,
    sunday_hours: 0,
  });

  const updateMutation = useTimesheetUpdate();

  useEffect(() => {
    if (timesheet) {
      setFormData({
        jobsite_id: timesheet.jobsite_id || '',
        monday_hours: Number(timesheet.monday_hours) || 0,
        tuesday_hours: Number(timesheet.tuesday_hours) || 0,
        wednesday_hours: Number(timesheet.wednesday_hours) || 0,
        thursday_hours: Number(timesheet.thursday_hours) || 0,
        friday_hours: Number(timesheet.friday_hours) || 0,
        saturday_hours: Number(timesheet.saturday_hours) || 0,
        sunday_hours: Number(timesheet.sunday_hours) || 0,
      });
    }
  }, [timesheet]);

  const handleHoursChange = (day: string, value: string) => {
    const hours = Math.max(0, Number(value) || 0);
    setFormData(prev => ({
      ...prev,
      [day]: hours
    }));
  };

  const calculateTotal = () => {
    return Object.entries(formData)
      .filter(([key]) => key.endsWith('_hours'))
      .reduce((total, [, hours]) => total + Number(hours), 0);
  };

  const handleSave = async () => {
    if (!timesheet) return;

    try {
      await updateMutation.mutateAsync({
        id: timesheet.id,
        data: {
          ...formData,
          total_hours: calculateTotal(),
          status: 'edited'
        }
      });
      onSave();
    } catch (error) {
      console.error('Failed to update timesheet:', error);
    }
  };

  if (!timesheet) return null;

  const days = [
    { key: 'monday_hours', label: 'Monday' },
    { key: 'tuesday_hours', label: 'Tuesday' },
    { key: 'wednesday_hours', label: 'Wednesday' },
    { key: 'thursday_hours', label: 'Thursday' },
    { key: 'friday_hours', label: 'Friday' },
    { key: 'saturday_hours', label: 'Saturday' },
    { key: 'sunday_hours', label: 'Sunday' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Timesheet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="jobsite">Job Site</Label>
            <Select value={formData.jobsite_id} onValueChange={(value) => setFormData(prev => ({ ...prev, jobsite_id: value }))}>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {days.map((day) => (
              <div key={day.key}>
                <Label htmlFor={day.key} className="text-sm">{day.label}</Label>
                <Input
                  id={day.key}
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData[day.key as keyof typeof formData]}
                  onChange={(e) => handleHoursChange(day.key, e.target.value)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total Hours:</span>
              <span className="text-xl font-bold text-gray-900">{calculateTotal()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetEditModal;
