import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MaterialRequest } from '../types/materialRequest';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  request: MaterialRequest | null;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  request,
  isDeleting = false
}) => {
  if (!request) return null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Material Request"
      description={`Are you sure you want to permanently delete the material request for "${request.jobsites?.name || 'Unknown Jobsite'}"? This action cannot be undone.`}
      confirmText="Delete Request"
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
};