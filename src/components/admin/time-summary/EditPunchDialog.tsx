import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Save } from 'lucide-react';
import { useUpdateTimesheet } from '@/hooks/useUpdateTimesheet';
import { DailyPunch } from '@/hooks/useTimeSummaryData';
import { cn } from '@/lib/utils';

interface EditPunchDialogProps {
  punch: DailyPunch | null;
  onClose: () => void;
}

const BREAK_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '40 min', value: 40 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
];

export const EditPunchDialog: React.FC<EditPunchDialogProps> = ({ punch, onClose }) => {
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('');
  const [isCustomBreak, setIsCustomBreak] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [punchDate, setPunchDate] = useState('');
  
  const { mutate: updateTimesheet, isPending } = useUpdateTimesheet();

  // Sync state when punch changes
  useEffect(() => {
    if (punch) {
      setPunchDate(punch.date);
      setCheckInTime(punch.check_in_time || '');
      setCheckOutTime(punch.check_out_time || '');
      const bm = punch.break_minutes?.toString() || '';
      setBreakMinutes(bm);
      // Check if stored value matches a preset
      const numVal = parseInt(bm);
      const isPreset = BREAK_PRESETS.some(p => p.value === numVal);
      setIsCustomBreak(bm !== '' && !isPreset);
      setAdminNote('');
    }
  }, [punch]);

  const handlePresetClick = (value: number) => {
    const current = parseInt(breakMinutes);
    if (current === value) {
      // Deselect
      setBreakMinutes('');
      setIsCustomBreak(false);
    } else {
      setBreakMinutes(value.toString());
      setIsCustomBreak(false);
    }
  };

  const handleSave = () => {
    if (!punch?.timesheet_id || !punchDate) return;
    
    // Convert HH:MM times to full ISO timestamps
    const fullCheckInTime = checkInTime 
      ? new Date(`${punchDate}T${checkInTime}:00`).toISOString()
      : null;
    const fullCheckOutTime = checkOutTime 
      ? new Date(`${punchDate}T${checkOutTime}:00`).toISOString()
      : null;
    
    updateTimesheet({
      timesheetId: punch.timesheet_id,
      checkInTime: fullCheckInTime,
      checkOutTime: fullCheckOutTime,
      breakMinutes: breakMinutes ? parseInt(breakMinutes) : null,
      adminNote: adminNote.trim() || undefined,
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  if (!punch) return null;

  const currentBreakNum = parseInt(breakMinutes);
  const activePreset = BREAK_PRESETS.find(p => p.value === currentBreakNum);

  return (
    <Dialog open={!!punch} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Time Entry
          </DialogTitle>
          <DialogDescription>
            Update check-in and check-out times for {punch.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Check-in Time */}
          <div className="space-y-2">
            <Label htmlFor="check-in" className="text-sm font-medium">
              Check-in Time
            </Label>
            <Input
              id="check-in"
              type="time"
              value={checkInTime || ''}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Original: {punch.check_in_time || '—'}
            </p>
          </div>

          {/* Check-out Time */}
          <div className="space-y-2">
            <Label htmlFor="check-out" className="text-sm font-medium">
              Check-out Time
            </Label>
            <Input
              id="check-out"
              type="time"
              value={checkOutTime || ''}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Original: {punch.check_out_time || '—'}
            </p>
          </div>

          {/* Break Time - Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Break Time
            </Label>
            <div className="flex flex-wrap gap-2">
              {BREAK_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={activePreset?.value === preset.value && !isCustomBreak ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs",
                    activePreset?.value === preset.value && !isCustomBreak && "ring-2 ring-primary/30"
                  )}
                  onClick={() => handlePresetClick(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                variant={isCustomBreak ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => {
                  setIsCustomBreak(true);
                  if (!isCustomBreak) setBreakMinutes('');
                }}
              >
                Custom
              </Button>
            </div>
            {isCustomBreak && (
              <Input
                type="number"
                min="0"
                max="180"
                placeholder="Enter minutes..."
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                className="w-full mt-2"
              />
            )}
            <p className="text-xs text-muted-foreground">
              {breakMinutes ? `${breakMinutes} minutes will be deducted from total hours` : 'No break deducted — select a preset or enter custom'}
            </p>
          </div>

          {/* Admin Note */}
          <div className="space-y-2">
            <Label htmlFor="admin-note" className="text-sm font-medium">
              Admin Note (Optional)
            </Label>
            <Textarea
              id="admin-note"
              placeholder="Reason for edit (e.g., Missed punch, Correction requested by employee...)"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Project</p>
            <p className="text-sm">{punch.jobsite_name}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !checkInTime}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
