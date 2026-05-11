import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePunchEdit } from '@/hooks/usePunchEdit';
import { format } from 'date-fns';
import { Coffee, StickyNote } from 'lucide-react';
import type { PunchRecord } from '@/hooks/useEmployeeHoursBreakdown';

const BREAK_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '40 min', value: 40 },
];

interface PunchEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  punch: PunchRecord | null;
  employeeName: string;
}

const toLocalDatetimeValue = (isoString: string) => {
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const PunchEditModal: React.FC<PunchEditModalProps> = ({ open, onOpenChange, punch, employeeName }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [isCustomBreak, setIsCustomBreak] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = usePunchEdit();

  useEffect(() => {
    if (punch) {
      setStartTime(toLocalDatetimeValue(punch.checkIn));
      setEndTime(punch.checkOut ? toLocalDatetimeValue(punch.checkOut) : '');
      setBreakMinutes(punch.breakMinutes);
      const isPreset = BREAK_PRESETS.some(p => p.value === punch.breakMinutes);
      setIsCustomBreak(punch.breakMinutes > 0 && !isPreset);
      setNote(punch.note ?? '');
      setError(null);
    }
  }, [punch]);

  const handleSave = () => {
    if (!punch) return;
    setError(null);

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (end && end <= start) {
      setError('End time must be after start time.');
      return;
    }

    if (end) {
      const grossMs = end.getTime() - start.getTime();
      const grossMins = grossMs / (1000 * 60);
      if (breakMinutes > grossMins) {
        setError('Break time cannot exceed total worked duration.');
        return;
      }
    }

    mutation.mutate(
      {
        id: punch.id,
        data: {
          check_in_time: start.toISOString(),
          check_out_time: end ? end.toISOString() : undefined,
          break_minutes: breakMinutes,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Punch — {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {punch && (
            <p className="text-xs text-muted-foreground">
              {format(new Date(punch.checkIn), 'EEE, MMM dd yyyy')}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
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
                  variant={breakMinutes === preset.value && !isCustomBreak ? 'default' : 'outline'}
                  onClick={() => {
                    if (breakMinutes === preset.value && !isCustomBreak) {
                      setBreakMinutes(0);
                    } else {
                      setBreakMinutes(preset.value);
                    }
                    setIsCustomBreak(false);
                  }}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={isCustomBreak ? 'default' : 'outline'}
                onClick={() => {
                  setIsCustomBreak(true);
                  const isPreset = BREAK_PRESETS.some(p => p.value === breakMinutes);
                  if (isPreset) setBreakMinutes(0);
                }}
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
                  value={breakMinutes || ''}
                  onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              {breakMinutes > 0
                ? `${breakMinutes} minutes will be deducted from total hours`
                : 'No break deducted'}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PunchEditModal;
