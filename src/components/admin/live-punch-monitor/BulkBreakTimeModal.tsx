import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coffee } from 'lucide-react';
import { useBulkPunchEdit } from '@/hooks/usePunchEdit';

const BREAK_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '40 min', value: 40 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
];

interface BulkBreakTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

const BulkBreakTimeModal: React.FC<BulkBreakTimeModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  onSuccess,
}) => {
  const [breakMinutes, setBreakMinutes] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: bulkUpdate, isPending } = useBulkPunchEdit();

  const parsedBreak = parseInt(breakMinutes) || 0;

  const handlePresetClick = (value: number) => {
    if (parseInt(breakMinutes) === value) {
      setBreakMinutes('');
    } else {
      setBreakMinutes(String(value));
    }
    setIsCustom(false);
    setShowConfirm(false);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    const currentVal = parseInt(breakMinutes);
    const isPreset = BREAK_PRESETS.some(p => p.value === currentVal);
    if (isPreset) setBreakMinutes('');
    setShowConfirm(false);
  };

  const handleApply = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    bulkUpdate(
      selectedIds.map(id => ({ id, data: { break_minutes: parsedBreak } })),
      {
        onSuccess: () => {
          onSuccess();
          onClose();
          setShowConfirm(false);
          setBreakMinutes('');
          setIsCustom(false);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            Bulk Add Break Time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Break Duration</Label>
            <div className="flex flex-wrap gap-2">
              {BREAK_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  size="sm"
                  variant={parseInt(breakMinutes) === preset.value && !isCustom ? 'default' : 'outline'}
                  onClick={() => handlePresetClick(preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={isCustom ? 'default' : 'outline'}
                onClick={handleCustomClick}
                className="text-xs"
              >
                Custom
              </Button>
            </div>
            {isCustom && (
              <div className="mt-2">
                <Input
                  type="number"
                  min={0}
                  max={480}
                  placeholder="Enter minutes"
                  value={breakMinutes}
                  onChange={(e) => { setBreakMinutes(e.target.value); setShowConfirm(false); }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              {parsedBreak > 0
                ? `${parsedBreak} minutes will be applied to all selected records`
                : 'No break selected'}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">{selectedIds.length}</Badge> record{selectedIds.length !== 1 ? 's' : ''} will be updated
          </div>

          {showConfirm && parsedBreak > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
              Apply <strong>{parsedBreak} min</strong> break to <strong>{selectedIds.length}</strong> record{selectedIds.length !== 1 ? 's' : ''}?
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleApply}
            disabled={isPending || parsedBreak === 0}
          >
            {isPending ? 'Updating...' : showConfirm ? 'Confirm' : 'Apply Break Time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkBreakTimeModal;
