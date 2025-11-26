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

interface EditPunchDialogProps {
  punch: DailyPunch | null;
  onClose: () => void;
}

export const EditPunchDialog: React.FC<EditPunchDialogProps> = ({ punch, onClose }) => {
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [punchDate, setPunchDate] = useState('');
  
  const { mutate: updateTimesheet, isPending } = useUpdateTimesheet();

  // Sync state when punch changes
  useEffect(() => {
    if (punch) {
      setPunchDate(punch.date);
      setCheckInTime(punch.check_in_time || '');
      setCheckOutTime(punch.check_out_time || '');
      setBreakMinutes(punch.break_minutes?.toString() || '');
      setAdminNote('');
    }
  }, [punch]);

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

          {/* Break Time */}
          <div className="space-y-2">
            <Label htmlFor="break-minutes" className="text-sm font-medium">
              Break Time (minutes)
            </Label>
            <Input
              id="break-minutes"
              type="number"
              min="0"
              max="120"
              placeholder={`Default: ${punch.break_minutes || 0} min (from time rules)`}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use time rules default
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
