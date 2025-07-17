
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useJobsites = (status?: 'active' | 'completed' | 'all') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobsites', user?.companyId, status],
    queryFn: async () => {
      console.log('Fetching jobsites for company:', user?.companyId, 'with status:', status);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      let query = supabase
        .from('jobsites')
        .select('*')
        .eq('company_id', user.companyId);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching jobsites:', error);
        throw error;
      }
      console.log('Jobsites fetched:', data);
      return data;
    },
    enabled: !!user?.companyId,
  });
};

export const useActiveJobsites = () => useJobsites('active');
export const useCompletedJobsites = () => useJobsites('completed');
