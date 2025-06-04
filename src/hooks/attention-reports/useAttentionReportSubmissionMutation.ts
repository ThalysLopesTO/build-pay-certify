
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AttentionReportData } from './types';

export const useAttentionReportSubmissionMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AttentionReportData) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated');
      }

      // Insert the attention report
      const { data: report, error: reportError } = await supabase
        .from('attention_reports')
        .insert([{
          submitted_by: user.id,
          company_id: user.companyId,
          jobsite_id: data.jobsiteId,
          report_date: data.reportDate,
          report_time: data.reportTime,
          message: data.message,
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      // Upload attachments if any
      if (data.attachments && data.attachments.length > 0) {
        for (const file of data.attachments) {
          const fileName = `${report.id}/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('attention-reports')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('attention-reports')
            .getPublicUrl(fileName);

          // Insert attachment record
          const { error: attachmentError } = await supabase
            .from('attention_report_attachments')
            .insert([{
              report_id: report.id,
              file_name: file.name,
              file_url: publicUrl,
              file_size: file.size,
              mime_type: file.type,
            }]);

          if (attachmentError) throw attachmentError;
        }
      }

      return report;
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your attention report has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['attention-reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-attention-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit attention report",
        variant: "destructive",
      });
    },
  });
};
