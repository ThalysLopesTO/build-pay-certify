import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { EquipmentUsageLog } from '@/types/equipment-usage';
import { Loader2 } from 'lucide-react';

interface ReturnToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageLog: EquipmentUsageLog | null;
  onReturn: (data: {
    usage_id: string;
    status: 'returned' | 'damaged' | 'lost';
    return_time?: string;
    notes?: string;
  }) => void;
  isReturning: boolean;
}

export const ReturnToolModal: React.FC<ReturnToolModalProps> = ({
  open,
  onOpenChange,
  usageLog,
  onReturn,
  isReturning,
}) => {
  const [status, setStatus] = useState<'returned' | 'damaged' | 'lost'>('returned');
  const [returnTime, setReturnTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageLog) return;

    onReturn({
      usage_id: usageLog.id,
      status,
      return_time: returnTime || undefined,
      notes: notes || undefined,
    });

    setStatus('returned');
    setReturnTime('');
    setNotes('');
    onOpenChange(false);
  };

  if (!usageLog) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark Equipment as Returned</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Equipment: {usageLog.equipment?.equipment_name}</p>
              <p className="text-sm text-muted-foreground">
                Assigned to: {usageLog.employee?.first_name} {usageLog.employee?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Jobsite: {usageLog.jobsite?.name}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Return Status *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)} required>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="returned">Returned (Good Condition)</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnTime">Return Time</Label>
              <Input
                id="returnTime"
                type="datetime-local"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                placeholder="Leave empty for current time"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={status === 'damaged' ? 'Describe the damage...' : status === 'lost' ? 'Provide details...' : 'Add any notes...'}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isReturning}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isReturning}>
              {isReturning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as {status === 'returned' ? 'Returned' : status === 'damaged' ? 'Damaged' : 'Lost'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
