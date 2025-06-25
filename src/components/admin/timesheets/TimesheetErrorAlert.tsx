
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface TimesheetErrorAlertProps {
  error: any;
}

const TimesheetErrorAlert: React.FC<TimesheetErrorAlertProps> = ({ error }) => {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Timesheets</AlertTitle>
      <AlertDescription>
        {error.message || 'An error occurred while loading timesheets. Please try again.'}
      </AlertDescription>
    </Alert>
  );
};

export default TimesheetErrorAlert;
