
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useEmployeeDirectory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-directory', user?.companyId],
    queryFn: async () => {
      console.log('Fetching employee directory for company:', user?.companyId);
      
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
        .in('role', ['employee', 'foreman', 'admin'])
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log('Fetched employees:', data);
      return data;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
