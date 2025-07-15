
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTimesheetPDF } from '@/hooks/useTimesheetPDF';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimesheetPDFGeneratorProps {
  timesheet: any;
  onDownloadSingle: (timesheet: any) => void;
}

const TimesheetPDFGenerator: React.FC<TimesheetPDFGeneratorProps> = ({
  timesheet,
  onDownloadSingle
}) => {
  const { generateTimesheetPDF } = useTimesheetPDF();
  const { settings: companySettings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { toast } = useToast();

  // Get jobsite name
  const { data: jobsite } = useQuery({
    queryKey: ['jobsite', timesheet.jobsite_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobsites')
        .select('name')
        .eq('id', timesheet.jobsite_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!timesheet.jobsite_id,
  });

  const handleDownload = async () => {
    try {
      const employeeName = timesheet.is_manual_entry 
        ? timesheet.manual_entry_name 
        : timesheet.employee_name || 'Unknown Employee';
      
      const jobsiteName = jobsite?.name || 'Unknown Jobsite';
      
      // Determine worker type
      let workerType = 'subcontractor';
      
      if (timesheet.is_manual_entry) {
        // For manual entries, use the worker_type field directly
        workerType = timesheet.worker_type || 'subcontractor';
      } else {
        // For regular employee timesheets, find the employee to get their worker type
        const employee = await supabase
          .from('user_profiles')
          .select('worker_type')
          .eq('user_id', timesheet.submitted_by)
          .single();
        
        workerType = employee?.data?.worker_type || 'subcontractor';
      }
      
      await generateTimesheetPDF({
        timesheet,
        companySettings,
        jobsiteName,
        employeeName,
        logoUrl,
        workerType
      });
      
      toast({
        title: 'PDF Generated',
        description: 'Timesheet PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      className="h-8 w-8 p-0"
      title="Download Timesheet PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default TimesheetPDFGenerator;
