import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useAttentionReportSubmissionMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ message, files }: { message: string; files: File[] }) => {
      if (!user?.company_id) {
        throw new Error('User not authenticated or company not found');
      }

      // Upload files if any
      const uploadedFiles = [];
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attention-reports')
          .upload(`${user.company_id}/${fileName}`, file);

        if (uploadError) throw uploadError;
        uploadedFiles.push(uploadData.path);
      }

      // Create attention report
      const { error: reportError } = await supabase
        .from('attention_reports')
        .insert([
          {
            company_id: user.company_id,
            reported_by: user.id,
            message,
            files: uploadedFiles,
          },
        ]);

      if (reportError) throw reportError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attention-reports'] });
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
