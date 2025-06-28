
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useMyAttentionReportsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-attention-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('attention_reports')
        .select(`
          *,
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
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};
