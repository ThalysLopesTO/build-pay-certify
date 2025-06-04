
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface RegistrationRequest {
  id: string;
  company_name: string;
  admin_first_name: string;
  admin_last_name: string;
}

interface RejectionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  request: RegistrationRequest | null;
  isProcessing: boolean;
}

const RejectionConfirmationDialog: React.FC<RejectionConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  request,
  isProcessing
}) => {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <XCircle className="h-5 w-5 mr-2 text-red-600" />
            Reject Registration Request
          </DialogTitle>
          <DialogDescription>
            You are about to reject the registration request for <strong>{request.company_name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">This action will:</p>
              <ul className="space-y-1">
                <li>• Mark the request as rejected</li>
                <li>• Prevent the company from being created</li>
                <li>• No user accounts will be created</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Request Details:</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Company:</strong> {request.company_name}</p>
              <p><strong>Admin:</strong> {request.admin_first_name} {request.admin_last_name}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionConfirmationDialog;
