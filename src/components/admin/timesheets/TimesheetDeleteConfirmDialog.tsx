import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface WeeklyTimesheet {
  id: string;
  employee_name: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  worker_type: string;
}

interface TimesheetDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  timesheet: WeeklyTimesheet | null;
  isDeleting: boolean;
}

export const TimesheetDeleteConfirmDialog: React.FC<TimesheetDeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  timesheet,
  isDeleting,
}) => {
  if (!timesheet) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Timesheet Record"
      description={`Are you sure you want to delete the timesheet for ${timesheet.employee_name}? 

Period: ${formatDate(timesheet.week_start_date)} - ${formatDate(timesheet.week_end_date)}
Total Hours: ${timesheet.total_hours}
Worker Type: ${timesheet.worker_type}

This action cannot be undone and will permanently remove this timesheet record from the system. This action will be logged for security purposes.`}
      confirmText={isDeleting ? "Deleting..." : "Delete Timesheet"}
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
};