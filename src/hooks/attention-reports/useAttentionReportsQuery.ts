
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useAttentionReportsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['attention-reports', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('attention_reports')
        .select(`
          *,
          user_profiles:submitted_by (
            first_name,
            last_name,
            role
          ),
          jobsites:jobsite_id (
            name,
            address
          ),
          attachments:attention_report_attachments (
            id,
            file_name,
            file_url,
            file_size,
            mime_type
          )
        `)
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.company_id,
  });
};
