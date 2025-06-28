
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useAttentionReportSubmissionMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobsiteId, reportDate, reportTime, message, attachments }: { 
      jobsiteId: string; 
      reportDate: string; 
      reportTime: string; 
      message: string; 
      attachments?: File[]; 
    }) => {
      if (!user?.company_id) {
        throw new Error('User not authenticated or company not found');
      }

      // Create attention report first
      const { data: reportData, error: reportError } = await supabase
        .from('attention_reports')
        .insert([
          {
            company_id: user.company_id,
            submitted_by: user.id,
            jobsite_id: jobsiteId,
            report_date: reportDate,
            report_time: reportTime,
            message,
          },
        ])
        .select()
        .single();

      if (reportError) throw reportError;

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const fileName = `${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attention-reports')
            .upload(`${user.company_id}/${fileName}`, file);

          if (uploadError) throw uploadError;

          // Create attachment record
          const { error: attachmentError } = await supabase
            .from('attention_report_attachments')
            .insert([
              {
                report_id: reportData.id,
                file_name: file.name,
                file_url: uploadData.path,
                file_size: file.size,
                mime_type: file.type,
              },
            ]);

          if (attachmentError) throw attachmentError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attention-reports'] });
      queryClient.invalidateQueries({ queryKey: ['foreman-attention-reports'] });
      toast({
        title: "Report Submitted",
        description: "Your attention report has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit attention report. Please try again.",
        variant: "destructive",
      });
    },
  });
};
