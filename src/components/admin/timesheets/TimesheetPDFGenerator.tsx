
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTimesheetPDF } from '@/hooks/useTimesheetPDF';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

interface TimesheetPDFGeneratorProps {
  timesheet: any;
  onDownloadSingle: (timesheet: any) => void;
}

export const TimesheetPDFGenerator: React.FC<TimesheetPDFGeneratorProps> = ({
  timesheet,
  onDownloadSingle
}) => {
  const { generateTimesheetPDF } = useTimesheetPDF();
  const { settings: companySettings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();

  const handleDownload = async () => {
    try {
      await generateTimesheetPDF({
        timesheet,
        companySettings,
        jobsiteName: timesheet.jobsite?.name || 'Unknown Jobsite',
        employeeName: timesheet.employee_name || 'Former Employee',
        logoUrl,
        workerType: timesheet.worker_type || 'subcontractor'
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      className="h-8 w-8 p-0"
      title="Download PDF"
    >
      <Download className="h-4 w-4 text-gray-500" />
    </Button>
  );
};
