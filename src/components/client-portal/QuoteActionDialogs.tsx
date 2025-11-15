import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signedName: string) => void;
  isLoading?: boolean;
}

export function ApproveQuoteDialog({ open, onOpenChange, onConfirm, isLoading }: ApproveDialogProps) {
  const [signedName, setSignedName] = useState('');

  const handleConfirm = () => {
    if (signedName.trim()) {
      onConfirm(signedName);
      setSignedName('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Quote</AlertDialogTitle>
          <AlertDialogDescription>
            By approving this quote, you agree to the terms and pricing outlined. Please sign your name to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="signedName">Your Full Name (Electronic Signature)</Label>
          <Input
            id="signedName"
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            placeholder="John Doe"
            className="mt-2"
            disabled={isLoading}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!signedName.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Approving...' : 'Approve Quote'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeclineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function DeclineQuoteDialog({ open, onOpenChange, onConfirm, isLoading }: DeclineDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Decline Quote</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for declining this quote. This helps us understand your needs better.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Reason for Declining</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Budget constraints, timeline issues, etc."
            className="mt-2 min-h-[100px]"
            disabled={isLoading}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Declining...' : 'Decline Quote'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface RequestChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  isLoading?: boolean;
}

export function RequestChangesDialog({ open, onOpenChange, onConfirm, isLoading }: RequestChangesDialogProps) {
  const [message, setMessage] = useState('');

  const handleConfirm = () => {
    if (message.trim()) {
      onConfirm(message);
      setMessage('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request Changes</AlertDialogTitle>
          <AlertDialogDescription>
            Let us know what changes you'd like to see in this quote. We'll review your request and get back to you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="message">Requested Changes</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe the changes you'd like..."
            className="mt-2 min-h-[120px]"
            disabled={isLoading}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
