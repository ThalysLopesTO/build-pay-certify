import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTimesheetPDF } from '@/hooks/useTimesheetPDF';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();

  // ✅ Fetch jobsite name using Supabase
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
      await generateTimesheetPDF({
        timesheet,
        companySettings,
        jobsiteName: jobsite?.name || 'Unknown Jobsite', // ✅ Now correct
        employeeName: timesheet.employee_name || 'Former Employee',
        logoUrl,
        workerType: timesheet.worker_type || 'subcontractor'
      });

      toast({
        title: 'PDF Generated',
        description: 'Timesheet PDF has been downloaded successfully.'
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
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
