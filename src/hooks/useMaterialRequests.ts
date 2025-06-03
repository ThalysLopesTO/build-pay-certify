
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useMaterialRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching material requests for user:', user.id);
      
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          *,
          jobsites (
            name,
            address
          )
        `)
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching material requests:', error);
        throw error;
      }

      console.log('Fetched material requests:', data);
      return data || [];
    },
    enabled: !!user?.id,
  });
};
