import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useArchivedEmployees = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['archived-employees', user?.companyId],
    queryFn: async () => {
      console.log('Fetching archived employees for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `)
        .eq('company_id', user.companyId)
        .eq('is_active', false)
        .in('role', ['employee', 'foreman', 'admin', 'management'])
        .order('first_name');

      if (error) {
        console.error('Error fetching archived employees:', error);
        throw error;
      }

      console.log('Fetched archived employees:', data);
      return data;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};