import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Clock, FileText, CheckCircle } from 'lucide-react';

interface ClockOutNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClockOut: (breakMinutes: number, note: string) => void;
  isLoading: boolean;
}

const BREAK_PRESETS = [
  { value: '0', label: 'No break' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: 'custom', label: 'Custom' },
];

const ClockOutNoteModal: React.FC<ClockOutNoteModalProps> = ({
  isOpen,
  onClose,
  onClockOut,
  isLoading
}) => {
  const [breakSelection, setBreakSelection] = useState<string>('');
  const [customBreak, setCustomBreak] = useState('');
  const [note, setNote] = useState('');
  const maxChars = 500;

  const isCustom = breakSelection === 'custom';
  const customBreakNum = parseInt(customBreak, 10);
  const breakMinutes = isCustom ? (isNaN(customBreakNum) ? -1 : customBreakNum) : parseInt(breakSelection, 10);
  const isBreakValid = breakSelection !== '' && (!isCustom || (!isNaN(customBreakNum) && customBreakNum >= 0));
  const isNoteValid = note.trim().length > 0;
  const showBreakWarning = isBreakValid && breakMinutes > 90;
  const canSubmit = isBreakValid && isNoteValid && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onClockOut(breakMinutes, note.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      setBreakSelection('');
      setCustomBreak('');
      setNote('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-5 w-5 text-primary" />
            Complete Punch Out
          </DialogTitle>
          <DialogDescription>
            Before finishing your shift, please select your break time and add a work note.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Break Time */}
          <div className="space-y-2">
            <Label htmlFor="break_time" className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Break Time <span className="text-destructive">*</span>
            </Label>
            <Select value={breakSelection} onValueChange={setBreakSelection}>
              <SelectTrigger className="h-12 text-base" id="break_time">
                <SelectValue placeholder="Select break duration" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {BREAK_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value} className="text-base py-3">
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isCustom && (
              <div className="pt-1">
                <Input
                  type="number"
                  min={0}
                  placeholder="Enter minutes (e.g. 45)"
                  value={customBreak}
                  onChange={(e) => setCustomBreak(e.target.value)}
                  className="h-12 text-base"
                  disabled={isLoading}
                />
              </div>
            )}

            {showBreakWarning && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Break over 90 minutes — please confirm this is correct.</span>
              </div>
            )}
          </div>

          {/* Work Note */}
          <div className="space-y-2">
            <Label htmlFor="work_note" className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Work Note <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="work_note"
              placeholder="e.g. Installed drywall in corridor, framing completed in unit 204..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={maxChars}
              className="min-h-[120px] resize-none text-base"
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Briefly describe what you did today</span>
              <span>{note.length}/{maxChars}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-12 text-base"
            >
              {isLoading ? 'Confirming...' : 'Confirm Punch Out'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClockOutNoteModal;
