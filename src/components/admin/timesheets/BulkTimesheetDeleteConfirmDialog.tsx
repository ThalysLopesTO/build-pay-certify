import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { format } from 'date-fns';

interface BulkTimesheetDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  timesheets: any[];
  isDeleting: boolean;
}

export const BulkTimesheetDeleteConfirmDialog: React.FC<BulkTimesheetDeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  timesheets,
  isDeleting,
}) => {
  const timesheetCount = timesheets.length;

  const getTimesheetSummary = () => {
    if (timesheetCount === 0) return '';
    if (timesheetCount <= 3) {
      return timesheets.map(t => {
        const employeeName = t.is_manual_entry 
          ? (t.manual_entry_name || 'Manual Entry')
          : (t.employee_name || 'Former Employee');
        const weekEnding = format(new Date(t.week_start_date), 'MMM dd, yyyy');
        return `• ${employeeName} - Week of ${weekEnding}`;
      }).join('\n');
    }
    return `${timesheetCount} timesheets from various employees and periods`;
  };

  const description = `⚠️ This action cannot be undone. The following timesheets will be permanently deleted and logged in the audit trail:\n\n${getTimesheetSummary()}`;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${timesheetCount} Timesheet${timesheetCount !== 1 ? 's' : ''}?`}
      description={description}
      confirmText={isDeleting ? 'Deleting...' : `Delete ${timesheetCount} Timesheet${timesheetCount !== 1 ? 's' : ''}`}
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
      isLoading={isDeleting}
    />
  );
};
