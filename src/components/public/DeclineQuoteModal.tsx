import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle } from 'lucide-react';

interface DeclineQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecline: (reason: string) => void;
  isLoading: boolean;
}

export const DeclineQuoteModal: React.FC<DeclineQuoteModalProps> = ({
  open,
  onOpenChange,
  onDecline,
  isLoading,
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onDecline(reason || 'No reason provided');
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Decline Quote</DialogTitle>
              <DialogDescription className="text-sm">
                Let us know why you're declining this quote
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for declining (optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please share your feedback so we can better understand your needs..."
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps us improve our quotes and services.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Declining...' : 'Decline Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
