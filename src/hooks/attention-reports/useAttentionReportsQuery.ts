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
          profiles:reported_by (
            first_name,
            last_name,
            role
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
