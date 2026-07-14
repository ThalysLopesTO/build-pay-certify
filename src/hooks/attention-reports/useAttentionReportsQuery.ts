
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { fetchProfilesByUserIds } from '@/lib/users/fetchProfiles';
import { AttentionReport } from './types';

export const useAttentionReportsQuery = () => {
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
          attention_report_attachments(*)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Submitter profiles fetched separately (submitted_by FK no longer embeds)
      const profileMap = await fetchProfilesByUserIds((data || []).map((r) => r.submitted_by));

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
        user_profiles: profileMap[report.submitted_by]
          ? { first_name: profileMap[report.submitted_by].first_name, last_name: profileMap[report.submitted_by].last_name }
          : null,
        attachments: report.attention_report_attachments || []
      })) as AttentionReport[];
    },
    enabled: !!user?.companyId,
  });
};
