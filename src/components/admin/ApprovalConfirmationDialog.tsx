
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
import { Building, User, AlertTriangle } from 'lucide-react';

interface RegistrationRequest {
  id: string;
  company_name: string;
  company_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
}

interface ApprovalConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  request: RegistrationRequest | null;
  isProcessing: boolean;
}

const ApprovalConfirmationDialog: React.FC<ApprovalConfirmationDialogProps> = ({
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
            <Building className="h-5 w-5 mr-2 text-green-600" />
            Approve Registration Request
          </DialogTitle>
          <DialogDescription>
            You are about to approve the registration request for <strong>{request.company_name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">This will create:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A new company record with active status</li>
              <li>• An auth user account for the admin</li>
              <li>• A user profile with admin privileges</li>
              <li>• Mark the request as approved</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <p>The admin will be created with a temporary password. They should reset it on first login.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Company Details:</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <p><strong>Company:</strong> {request.company_name}</p>
              <p><strong>Email:</strong> {request.company_email}</p>
              <p><strong>Admin:</strong> {request.admin_first_name} {request.admin_last_name}</p>
              <p><strong>Admin Email:</strong> {request.admin_email}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? 'Approving...' : 'Approve Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalConfirmationDialog;
