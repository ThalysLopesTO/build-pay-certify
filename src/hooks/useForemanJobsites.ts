import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface ForemanJobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  due_date?: string;
  status: string;
  assigned_foreman_id?: string;
  created_at: string;
  company_id: string;
}

export const useForemanJobsites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['foreman-jobsites', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('jobsites')
        .select('*')
        .eq('assigned_foreman_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching foreman jobsites:', error);
        throw error;
      }

      return data as ForemanJobsite[];
    },
    enabled: !!user?.id,
  });
};