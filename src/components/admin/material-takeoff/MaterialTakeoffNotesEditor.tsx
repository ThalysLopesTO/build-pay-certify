
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMaterialTakeoffNotes } from '@/hooks/useMaterialTakeoffNotes';
import { Loader2, Save, X } from 'lucide-react';

interface MaterialTakeoffNotesEditorProps {
  jobsiteId: string;
  jobsiteName: string;
  open: boolean;
  onClose: () => void;
}

const MaterialTakeoffNotesEditor: React.FC<MaterialTakeoffNotesEditorProps> = ({
  jobsiteId,
  jobsiteName,
  open,
  onClose,
}) => {
  const { getNoteByJobsite, createOrUpdateNote } = useMaterialTakeoffNotes();
  const [notes, setNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const existingNote = getNoteByJobsite(jobsiteId);

  useEffect(() => {
    if (open) {
      const initialNotes = existingNote?.takeoff_notes || '';
      setNotes(initialNotes);
      setHasChanges(false);
    }
  }, [open, existingNote]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== (existingNote?.takeoff_notes || ''));
  };

  const handleSave = async () => {
    try {
      await createOrUpdateNote.mutateAsync({
        jobsiteId,
        notes,
      });
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Material Takeoff Notes - {jobsiteName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">
              Material List & Notes
              <span className="text-sm text-muted-foreground ml-2">
                (Free-form text - add materials, quantities, notes, etc.)
              </span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Enter your material takeoff notes here...

Example:
- 2x4 lumber: 50 pieces
- Drywall sheets: 20 sheets
- Screws: 5 lbs
- Paint: 3 gallons white, 1 gallon primer
- Electrical conduit: 200 ft

Notes:
- Check with supplier for bulk pricing
- Delivery needed by Friday"
              className="min-h-[400px] resize-none font-mono text-sm"
              maxLength={50000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {notes.length.toLocaleString()} / 50,000 characters
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {existingNote ? (
              <>Last updated: {new Date(existingNote.updated_at).toLocaleString()}</>
            ) : (
              <>New material takeoff notes</>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || createOrUpdateNote.isPending}
            >
              {createOrUpdateNote.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialTakeoffNotesEditor;
