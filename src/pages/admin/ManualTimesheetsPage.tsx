import React from 'react';
import { ClipboardList } from 'lucide-react';
import { ManualTimesheetForm } from '@/components/admin/manual-timesheets/ManualTimesheetForm';

const ManualTimesheetsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Time Sheet</h1>
          <p className="text-sm text-muted-foreground">
            Manually create and manage employee timesheets.
          </p>
        </div>
      </div>

      <ManualTimesheetForm />
    </div>
  );
};

export default ManualTimesheetsPage;
