import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Clock, FileText, CheckCircle, Receipt, Plus, X, ImagePlus } from 'lucide-react';

export interface ClockOutBillPayload {
  files: File[];
  amount: number | null;
  description: string | null;
}

interface ClockOutNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClockOut: (breakMinutes: number, note: string, bill?: ClockOutBillPayload) => void;
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

  // Reimbursement bill state
  const [showBill, setShowBill] = useState(false);
  const [billFiles, setBillFiles] = useState<File[]>([]);
  const [billAmount, setBillAmount] = useState('');
  const [billDescription, setBillDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxChars = 500;

  const isCustom = breakSelection === 'custom';
  const customBreakNum = parseInt(customBreak, 10);
  const breakMinutes = isCustom ? (isNaN(customBreakNum) ? -1 : customBreakNum) : parseInt(breakSelection, 10);
  const isBreakValid = breakSelection !== '' && (!isCustom || (!isNaN(customBreakNum) && customBreakNum >= 0));
  const isNoteValid = note.trim().length > 0;
  const showBreakWarning = isBreakValid && breakMinutes > 90;

  // A bill is only valid to send if at least one photo is attached
  const billReady = showBill && billFiles.length > 0;
  const canSubmit = isBreakValid && isNoteValid && !isLoading && (!showBill || billFiles.length > 0);

  const previews = billFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length) {
      setBillFiles((prev) => [...prev, ...files]);
    }
    // reset so the same file can be picked again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setBillFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetState = () => {
    setBreakSelection('');
    setCustomBreak('');
    setNote('');
    setShowBill(false);
    setBillFiles([]);
    setBillAmount('');
    setBillDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    let bill: ClockOutBillPayload | undefined;
    if (billReady) {
      const amountNum = parseFloat(billAmount);
      bill = {
        files: billFiles,
        amount: isNaN(amountNum) ? null : amountNum,
        description: billDescription.trim() ? billDescription.trim() : null,
      };
    }

    onClockOut(breakMinutes, note.trim(), bill);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetState();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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

          {/* Reimbursement Bill (optional) */}
          <div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-base font-semibold leading-none">Reimbursement bill</p>
                  <p className="text-xs text-muted-foreground mt-1">Optional — attach a receipt to get paid back.</p>
                </div>
              </div>
              {!showBill && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBill(true)}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add bill
                </Button>
              )}
            </div>

            {showBill && (
              <div className="space-y-4 pt-1">
                {/* Photo uploader */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-background py-5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span>Tap to add photo(s)</span>
                </button>

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((p, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
                        <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={isLoading}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                          aria-label="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="bill_amount" className="text-sm font-medium">Amount ($)</Label>
                  <Input
                    id="bill_amount"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="bill_desc" className="text-sm font-medium">Description / note</Label>
                  <Textarea
                    id="bill_desc"
                    placeholder="e.g. Hardware store — screws and brackets"
                    value={billDescription}
                    onChange={(e) => setBillDescription(e.target.value)}
                    maxLength={300}
                    className="min-h-[70px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {billFiles.length === 0 ? 'Add at least one photo to submit the bill.' : `${billFiles.length} photo(s) attached`}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBill(false);
                      setBillFiles([]);
                      setBillAmount('');
                      setBillDescription('');
                    }}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
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
