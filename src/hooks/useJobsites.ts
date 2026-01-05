
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useJobsites = (status?: 'active' | 'completed' | 'all') => {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['jobsites', user?.companyId, user?.id, status],
    queryFn: async () => {
      console.log('Fetching jobsites for company:', user?.companyId, 'with status:', status);
      
      if (!user?.companyId) {
        console.log('No company ID available - user may still be loading');
        return [];
      }

      let query = supabase
        .from('jobsites')
        .select('*')
        .eq('company_id', user.companyId);

      if (status === 'active') {
        query = query.eq('status', 'active');
      } else if (status === 'completed') {
        query = query.eq('status', 'completed');
      } else {
        query = query.in('status', ['active', 'completed']);
      }

      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Error fetching jobsites:', error);
        throw error;
      }
      console.log('Jobsites fetched:', data?.length, 'items');
      return data || [];
    },
    enabled: !!user?.companyId && !authLoading,
    staleTime: 30000,
  });
};

export const useActiveJobsites = () => useJobsites('active');
export const useCompletedJobsites = () => useJobsites('completed');
