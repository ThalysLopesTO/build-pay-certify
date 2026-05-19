
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { usePunchEdit } from '@/hooks/usePunchEdit';
import { format } from 'date-fns';
import { AlertTriangle, Coffee } from 'lucide-react';

interface EditPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  timesheet: any;
  onSuccess?: () => void;
  /** When true, restricts editing to the work note only (used for Foreman role) */
  notesOnly?: boolean;
}

const BREAK_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '40 min', value: 40 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
];

const EditPunchModal: React.FC<EditPunchModalProps> = ({
  isOpen,
  onClose,
  timesheet,
  onSuccess,
  notesOnly = false,
}) => {
  const { data: jobsites } = useActiveJobsites();
  const { mutate: updatePunch, isPending: isEditing } = usePunchEdit();
  
  const [formData, setFormData] = useState({
    check_in_time: '',
    check_out_time: '',
    jobsite_id: '',
    work_note: ''
  });

  const [breakMinutes, setBreakMinutes] = useState<string>('');
  const [isCustomBreak, setIsCustomBreak] = useState(false);

  useEffect(() => {
    if (timesheet && isOpen) {
      setFormData({
        check_in_time: timesheet.check_in_time 
          ? format(new Date(timesheet.check_in_time), "yyyy-MM-dd'T'HH:mm")
          : '',
        check_out_time: timesheet.check_out_time 
          ? format(new Date(timesheet.check_out_time), "yyyy-MM-dd'T'HH:mm")
          : '',
        jobsite_id: timesheet.jobsite_id || '',
        work_note: timesheet.work_note || ''
      });

      const existing = timesheet.break_minutes;
      if (existing && existing > 0) {
        setBreakMinutes(String(existing));
        const isPreset = BREAK_PRESETS.some(p => p.value === existing);
        setIsCustomBreak(!isPreset);
      } else {
        setBreakMinutes('');
        setIsCustomBreak(false);
      }
    }
  }, [timesheet, isOpen]);

  const handlePresetClick = (value: number) => {
    if (parseInt(breakMinutes) === value) {
      setBreakMinutes('');
    } else {
      setBreakMinutes(String(value));
    }
    setIsCustomBreak(false);
  };

  const handleCustomClick = () => {
    setIsCustomBreak(true);
    const currentVal = parseInt(breakMinutes);
    const isPreset = BREAK_PRESETS.some(p => p.value === currentVal);
    if (isPreset) {
      setBreakMinutes('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: any = {};

    if (notesOnly) {
      // Foremen can only update the work note
      updateData.work_note = formData.work_note.trim() || null;
    } else {
      if (formData.check_in_time) {
        updateData.check_in_time = new Date(formData.check_in_time).toISOString();
      }
      if (formData.check_out_time) {
        updateData.check_out_time = new Date(formData.check_out_time).toISOString();
      }
      if (formData.jobsite_id) {
        updateData.jobsite_id = formData.jobsite_id;
      }
      if (formData.work_note !== undefined) {
        updateData.work_note = formData.work_note.trim() || null;
      }
      updateData.break_minutes = breakMinutes ? parseInt(breakMinutes) : 0;
    }

    updatePunch({
      id: timesheet.id,
      data: updateData
    }, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      }
    });
  };

  const isOpenShift = timesheet?.check_in_time && !timesheet?.check_out_time;
  const parsedBreak = parseInt(breakMinutes) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {notesOnly ? 'Edit Work Note' : 'Edit Punch Record'}
            {isOpenShift && !notesOnly && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Open Shift</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {notesOnly && (
          <p className="text-xs text-muted-foreground -mt-2">
            As a Foreman you can update the work note. Only Admins and Managers can change hours.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!notesOnly && (
          <div>
            <Label htmlFor="check_in_time">Clock In Time</Label>
            <Input
              id="check_in_time"
              type="datetime-local"
              value={formData.check_in_time}
              onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="check_out_time">Clock Out Time</Label>
            <Input
              id="check_out_time"
              type="datetime-local"
              value={formData.check_out_time}
              onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
            />
            {isOpenShift && (
              <p className="text-sm text-red-600 mt-1">
                Employee forgot to clock out - please set the clock out time
              </p>
            )}
          </div>

          {/* Break Time Section */}
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Coffee className="h-4 w-4 text-muted-foreground" />
              Break Time
            </Label>
            <div className="flex flex-wrap gap-2">
              {BREAK_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  size="sm"
                  variant={parseInt(breakMinutes) === preset.value && !isCustomBreak ? 'default' : 'outline'}
                  onClick={() => handlePresetClick(preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={isCustomBreak ? 'default' : 'outline'}
                onClick={handleCustomClick}
                className="text-xs"
              >
                Custom
              </Button>
            </div>
            {isCustomBreak && (
              <div className="mt-2">
                <Input
                  type="number"
                  min={0}
                  max={180}
                  placeholder="Enter minutes"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              {parsedBreak > 0
                ? `${parsedBreak} minutes will be deducted from total hours`
                : 'No break deducted'}
            </p>
          </div>

          <div>
            <Label htmlFor="jobsite_id">Jobsite</Label>
            <Select 
              value={formData.jobsite_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, jobsite_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select jobsite" />
              </SelectTrigger>
              <SelectContent>
                {jobsites?.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="work_note">Work Note</Label>
            <Textarea
              id="work_note"
              placeholder="Description of work performed (optional)"
              value={formData.work_note}
              onChange={(e) => setFormData(prev => ({ ...prev, work_note: e.target.value }))}
              maxLength={500}
              className="min-h-[80px]"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {formData.work_note.length}/500 characters
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isEditing}>
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPunchModal;
