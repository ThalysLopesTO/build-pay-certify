
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface AttentionReportData {
  jobsiteId: string;
  reportDate: string;
  reportTime: string;
  message: string;
  attachments?: File[];
}

interface AttentionReport {
  id: string;
  submitted_by: string;
  company_id: string;
  jobsite_id: string;
  report_date: string;
  report_time: string;
  message: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  jobsites?: { name: string };
  user_profiles?: { first_name: string; last_name: string };
  attachments?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
  }>;
}

export const useAttentionReports = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['attention-reports', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('attention_reports')
        .select(`
          *,
          jobsites(name),
          user_profiles!attention_reports_submitted_by_fkey(first_name, last_name),
          attention_report_attachments(*)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AttentionReport[];
    },
    enabled: !!user?.companyId,
  });
};

export const useMyAttentionReports = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-attention-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('attention_reports')
        .select(`
          *,
          jobsites(name),
          attention_report_attachments(*)
        `)
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AttentionReport[];
    },
    enabled: !!user?.id,
  });
};

export const useAttentionReportSubmission = () => {
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

export const useMarkReportAsReviewed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('attention_reports')
        .update({
          status: 'reviewed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Report Reviewed",
        description: "The report has been marked as reviewed",
      });
      queryClient.invalidateQueries({ queryKey: ['attention-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update report status",
        variant: "destructive",
      });
    },
  });
};
