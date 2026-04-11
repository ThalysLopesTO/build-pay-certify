import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useBulkPunchEdit } from '@/hooks/usePunchEdit';

interface PunchEntry {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  user_profiles: { first_name: string; last_name: string } | null;
  jobsites: { name: string } | null;
}

interface BulkClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntries: PunchEntry[];
  onSuccess: () => void;
}

const BulkClockOutModal: React.FC<BulkClockOutModalProps> = ({
  isOpen,
  onClose,
  selectedEntries,
  onSuccess,
}) => {
  const [clockOutTime, setClockOutTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: bulkUpdate, isPending } = useBulkPunchEdit();

  // Only entries that are still active (no check_out_time)
  const activeEntries = selectedEntries.filter(e => !e.check_out_time && e.check_in_time);

  const validationErrors = useMemo(() => {
    if (!clockOutTime) return [];
    const outTime = new Date(clockOutTime);
    return activeEntries
      .filter(e => e.check_in_time && new Date(e.check_in_time) >= outTime)
      .map(e => ({
        id: e.id,
        name: e.user_profiles ? `${e.user_profiles.first_name} ${e.user_profiles.last_name}` : 'Unknown',
        checkIn: e.check_in_time!,
      }));
  }, [clockOutTime, activeEntries]);

  const validEntries = activeEntries.filter(e => !validationErrors.find(v => v.id === e.id));

  const handleApply = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    const outIso = new Date(clockOutTime).toISOString();
    bulkUpdate(
      validEntries.map(e => ({ id: e.id, data: { check_out_time: outIso } })),
      {
        onSuccess: () => {
          onSuccess();
          onClose();
          setShowConfirm(false);
        },
      }
    );
  };

  const handleClose = () => {
    setShowConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Bulk Set Clock Out
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bulk-clock-out">Clock Out Time</Label>
            <Input
              id="bulk-clock-out"
              type="datetime-local"
              value={clockOutTime}
              onChange={(e) => { setClockOutTime(e.target.value); setShowConfirm(false); }}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">{activeEntries.length}</Badge> active record{activeEntries.length !== 1 ? 's' : ''} will be updated
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                {validationErrors.length} record{validationErrors.length !== 1 ? 's' : ''} will be skipped
              </div>
              <ul className="text-xs text-destructive/80 space-y-1 ml-6 list-disc">
                {validationErrors.map(e => (
                  <li key={e.id}>
                    {e.name} — checked in at {format(new Date(e.checkIn), 'h:mm a')} (after selected time)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showConfirm && validEntries.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
              Apply clock-out time <strong>{format(new Date(clockOutTime), 'h:mm a')}</strong> to <strong>{validEntries.length}</strong> record{validEntries.length !== 1 ? 's' : ''}?
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleApply}
            disabled={isPending || validEntries.length === 0}
          >
            {isPending ? 'Updating...' : showConfirm ? 'Confirm' : `Apply to ${validEntries.length} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkClockOutModal;
