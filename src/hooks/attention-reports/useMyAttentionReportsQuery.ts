
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AttentionReport } from './types';

export const useMyAttentionReportsQuery = () => {
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
      
      // Transform the data to match our interface
      return (data || []).map(report => ({
        id: report.id,
        submitted_by: report.submitted_by,
        company_id: report.company_id,
        jobsite_id: report.jobsite_id,
        report_date: report.report_date,
        report_time: report.report_time,
        message: report.message,
        status: report.status,
        reviewed_by: report.reviewed_by,
        reviewed_at: report.reviewed_at,
        created_at: report.created_at,
        jobsites: report.jobsites,
        attachments: report.attention_report_attachments || []
      })) as AttentionReport[];
    },
    enabled: !!user?.id,
  });
};
