
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useJobsites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobsites', user?.companyId],
    queryFn: async () => {
      console.log('Fetching jobsites for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      const { data, error } = await supabase
        .from('jobsites')
        .select('*')
        .eq('company_id', user.companyId)
        .order('name');
      
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
