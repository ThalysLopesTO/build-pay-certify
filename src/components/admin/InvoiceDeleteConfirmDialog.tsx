import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Invoice } from './types/invoice';

interface InvoiceDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  invoice: Invoice | null;
  isDeleting: boolean;
}

export const InvoiceDeleteConfirmDialog: React.FC<InvoiceDeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  invoice,
  isDeleting,
}) => {
  if (!invoice) return null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Invoice"
      description={`Are you sure you want to delete invoice ${invoice.invoice_number} for ${invoice.client_company}? This action cannot be undone and will permanently remove the invoice and all its line items.`}
      confirmText={isDeleting ? "Deleting..." : "Delete Invoice"}
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
};