import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DailyReport } from '@/hooks/useDailyReports';
import { getReportDisplayDate } from '@/utils/timezone';

interface DailyReportDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  report: DailyReport | null;
  isDeleting: boolean;
  timezone?: string;
}

export const DailyReportDeleteConfirmDialog: React.FC<DailyReportDeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  report,
  isDeleting,
  timezone,
}) => {
  if (!report) return null;

  const jobsiteName = report.jobsites?.name || 'Unknown Jobsite';
  const submittedBy = report.user_profiles 
    ? `${report.user_profiles.first_name} ${report.user_profiles.last_name}`
    : 'Unknown User';
  const reportDate = getReportDisplayDate(report.report_date, timezone);
  const summaryPreview = report.summary.length > 100 
    ? `${report.summary.substring(0, 100)}...` 
    : report.summary;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Daily Report"
      description={`Are you sure you want to delete this daily report?

Jobsite: ${jobsiteName}
Report Date: ${reportDate}
Submitted By: ${submittedBy}
Summary: ${summaryPreview}

This action cannot be undone and will permanently remove this daily report from the system. This action will be logged for security purposes.`}
      confirmText={isDeleting ? "Deleting..." : "Delete Report"}
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
};