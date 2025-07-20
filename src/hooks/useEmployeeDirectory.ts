
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
        .eq('is_active', true)
        .in('role', ['employee', 'foreman', 'admin', 'management'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log('Fetched employees:', data);
      return data;
    },
    enabled: !!user?.companyId,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced for fresh data)
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};
