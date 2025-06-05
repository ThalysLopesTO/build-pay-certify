
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Company {
  id: string;
  name: string;
  status: string;
  registration_date: string | null;
  expiration_date: string | null;
  created_at: string;
  is_expired: boolean;
  days_until_expiry: number | null;
  admin_email?: string;
  admin_phone?: string;
}

interface RevokeCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onConfirm: () => void;
  isProcessing: boolean;
}

const RevokeCompanyDialog: React.FC<RevokeCompanyDialogProps> = ({
  open,
  onOpenChange,
  company,
  onConfirm,
  isProcessing
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Company Access</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to revoke access for <strong>{company?.name}</strong>?
            </p>
            <p className="text-sm text-red-600">
              This action will:
            </p>
            <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
              <li>Change the company status to "Revoked"</li>
              <li>Restrict platform access for all users in this company</li>
              <li>Prevent all company members from logging in</li>
            </ul>
            <p className="text-sm font-medium">
              This action can be reversed by changing the company status back to "Active".
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? 'Revoking...' : 'Revoke Access'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RevokeCompanyDialog;
