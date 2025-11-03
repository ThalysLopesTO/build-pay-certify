import React from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EquipmentUsageLog } from '@/types/equipment-usage';
import { formatInCompanyTimezone } from '@/utils/timezone';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface UsageLogDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usageLog: EquipmentUsageLog | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const UsageLogDeleteConfirmDialog: React.FC<UsageLogDeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  usageLog,
  onConfirm,
  isDeleting,
}) => {
  const { settings: companySettings } = useCompanySettings();

  if (!usageLog) return null;

  const equipmentName = usageLog.equipment?.equipment_name || 'Unknown Equipment';
  const employeeName = usageLog.employee 
    ? `${usageLog.employee.first_name} ${usageLog.employee.last_name}`
    : 'Unknown Employee';
  const jobsiteName = usageLog.jobsite?.name || 'Unknown Jobsite';
  const startTime = formatInCompanyTimezone(
    usageLog.start_time,
    'MMM d, yyyy h:mm a',
    companySettings?.timezone
  );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Usage Log"
      description={
        `Are you sure you want to permanently delete this usage log?\n\n` +
        `Equipment: ${equipmentName}\n` +
        `Employee: ${employeeName}\n` +
        `Jobsite: ${jobsiteName}\n` +
        `Start: ${startTime}\n\n` +
        `This action cannot be undone.`
      }
      confirmText="Delete Record"
      cancelText="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
      isLoading={isDeleting}
    />
  );
};
