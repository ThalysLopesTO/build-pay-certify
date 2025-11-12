import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface ApproveQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signedName: string) => void;
  isLoading: boolean;
  quoteTotal: number;
}

export const ApproveQuoteModal = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  quoteTotal
}: ApproveQuoteModalProps) => {
  const [signedName, setSignedName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleConfirm = () => {
    if (signedName.trim() && agreedToTerms) {
      onConfirm(signedName.trim());
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSignedName('');
      setAgreedToTerms(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Quote</DialogTitle>
          <DialogDescription>
            You are approving this quote for ${quoteTotal.toFixed(2)}. Please provide your full name as a digital signature.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="signedName">Full Name (Digital Signature) *</Label>
            <Input
              id="signedName"
              placeholder="Enter your full name"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              disabled={isLoading}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              I agree to the terms and conditions and approve this quote for the amount shown above.
            </Label>
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
            disabled={!signedName.trim() || !agreedToTerms || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
