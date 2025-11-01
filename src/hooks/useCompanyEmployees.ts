import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useCompanyEmployees = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['company-employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, photo_url, role')
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.companyId,
  });
};
