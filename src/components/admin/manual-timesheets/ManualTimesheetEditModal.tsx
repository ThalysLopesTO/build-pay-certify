import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HourlyTimesheetForm } from './HourlyTimesheetForm';
import type { ManualTimesheet } from '@/hooks/useManualTimesheets';

interface Props {
  timesheet: ManualTimesheet | null;
  onClose: () => void;
}

export const ManualTimesheetEditModal: React.FC<Props> = ({ timesheet, onClose }) => {
  return (
    <Dialog open={!!timesheet} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Timesheet</DialogTitle>
        </DialogHeader>
        {timesheet && (
          <HourlyTimesheetForm
            initial={timesheet}
            onSaved={onClose}
            submitLabel="Update Timesheet"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
