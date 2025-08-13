import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ClockOutNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClockOut: (note?: string) => void;
  isLoading: boolean;
}

const ClockOutNoteModal: React.FC<ClockOutNoteModalProps> = ({
  isOpen,
  onClose,
  onClockOut,
  isLoading
}) => {
  const [note, setNote] = useState('');
  const maxChars = 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNote = note.trim();
    onClockOut(trimmedNote || undefined);
  };

  const handleSkip = () => {
    onClockOut();
  };

  const handleClose = () => {
    if (!isLoading) {
      setNote('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add today's note (optional)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="work_note">Work Summary</Label>
            <Textarea
              id="work_note"
              placeholder="Key tasks, locations, issues, materials used…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={maxChars}
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>Optional - help your manager understand your day</span>
              <span>{note.length}/{maxChars}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1"
            >
              Skip
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Clocking Out...' : 'Save & Clock Out'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClockOutNoteModal;