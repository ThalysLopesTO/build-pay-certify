
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface TimesheetPDFGeneratorProps {
  timesheet: any;
  onDownloadSingle: (timesheet: any) => void;
}

const TimesheetPDFGenerator: React.FC<TimesheetPDFGeneratorProps> = ({
  timesheet,
  onDownloadSingle
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onDownloadSingle(timesheet)}
      className="h-8 w-8 p-0"
      title="Download PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default TimesheetPDFGenerator;
