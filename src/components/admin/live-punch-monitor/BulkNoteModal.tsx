import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useBulkPunchEdit } from '@/hooks/usePunchEdit';

interface PunchEntry {
  id: string;
  work_note: string | null;
}

interface BulkNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntries: PunchEntry[];
  onSuccess: () => void;
}

const BulkNoteModal: React.FC<BulkNoteModalProps> = ({
  isOpen,
  onClose,
  selectedEntries,
  onSuccess,
}) => {
  const [note, setNote] = useState('');
  const [appendMode, setAppendMode] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: bulkUpdate, isPending } = useBulkPunchEdit();

  const entriesWithNotes = selectedEntries.filter(e => e.work_note && e.work_note.trim());

  const handleApply = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    const updates = selectedEntries.map(entry => {
      let finalNote: string;
      if (appendMode && entry.work_note && entry.work_note.trim()) {
        finalNote = `${entry.work_note.trim()}\n${note.trim()}`;
      } else {
        finalNote = note.trim();
      }
      return { id: entry.id, data: { work_note: finalNote || null } };
    });

    bulkUpdate(updates, {
      onSuccess: () => {
        onSuccess();
        onClose();
        setShowConfirm(false);
        setNote('');
      },
    });
  };

  const handleClose = () => {
    setShowConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Bulk Add Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bulk-note" className="mb-2 block">Note</Label>
            <Textarea
              id="bulk-note"
              placeholder="Enter note to apply to selected records..."
              value={note}
              onChange={(e) => { setNote(e.target.value); setShowConfirm(false); }}
              maxLength={500}
              className="min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {note.length}/500 characters
            </div>
          </div>

          {entriesWithNotes.length > 0 && (
            <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="append-toggle" className="text-sm font-medium cursor-pointer">
                  Append to existing notes
                </Label>
                <p className="text-xs text-muted-foreground">
                  {entriesWithNotes.length} record{entriesWithNotes.length !== 1 ? 's have' : ' has'} existing notes
                </p>
              </div>
              <Switch
                id="append-toggle"
                checked={appendMode}
                onCheckedChange={(checked) => { setAppendMode(checked); setShowConfirm(false); }}
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">{selectedEntries.length}</Badge> record{selectedEntries.length !== 1 ? 's' : ''} will be updated
            {!appendMode && entriesWithNotes.length > 0 && (
              <span className="text-destructive ml-1">
                (existing notes will be replaced)
              </span>
            )}
          </div>

          {showConfirm && note.trim() && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
              {appendMode ? 'Append' : 'Replace with'} note on <strong>{selectedEntries.length}</strong> record{selectedEntries.length !== 1 ? 's' : ''}?
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleApply}
            disabled={isPending || !note.trim()}
          >
            {isPending ? 'Updating...' : showConfirm ? 'Confirm' : 'Apply Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkNoteModal;
