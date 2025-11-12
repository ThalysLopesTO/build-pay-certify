import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface RequestChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  isLoading: boolean;
}

export const RequestChangesModal = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}: RequestChangesModalProps) => {
  const [message, setMessage] = useState('');

  const handleConfirm = () => {
    if (message.trim()) {
      onConfirm(message.trim());
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMessage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Changes</DialogTitle>
          <DialogDescription>
            Please describe the changes you'd like to see in this quote. We'll review your request and get back to you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Change Request Message *</Label>
            <Textarea
              id="message"
              placeholder="Please describe what you'd like changed..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!message.trim() || message.length > 500 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
