
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AttentionReport } from './types';

export const useForemanAttentionReportsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['foreman-attention-reports', user?.companyId],
    queryFn: async () => {
      console.log('Fetching attention reports for foreman, company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      const { data, error } = await supabase
        .from('attention_reports')
        .select(`
          *,
          jobsites!inner(
            id,
            name
          ),
          attention_report_attachments(
            id,
            file_name,
            file_url,
            file_size,
            mime_type
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching attention reports:', error);
        throw new Error(`Failed to fetch attention reports: ${error.message}`);
      }
      
      console.log('Fetched attention reports:', data);
      
      // Fetch user profiles separately to avoid join issues
      const userIds = [...new Set(data?.map(report => report.submitted_by) || [])];
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (userProfilesError) {
        console.error('Error fetching user profiles:', userProfilesError);
        throw new Error(`Failed to fetch user profiles: ${userProfilesError.message}`);
      }

      // Create a map of user profiles for quick lookup
      const userProfilesMap = new Map(
        userProfiles?.map(profile => [profile.user_id, profile]) || []
      );
      
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
        user_profiles: userProfilesMap.get(report.submitted_by) || { first_name: 'Unknown', last_name: 'User' },
        attachments: report.attention_report_attachments || []
      })) as AttentionReport[];
    },
    enabled: !!user?.companyId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute to keep data fresh
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
