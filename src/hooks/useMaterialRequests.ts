
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useMaterialRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available');
        return [];
      }

      console.log('Fetching material requests for user:', user.id);
      
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          id,
          delivery_date,
          delivery_time,
          floor_unit,
          material_list,
          status,
          created_at,
          submitted_by,
          jobsites (
            name,
            address
          )
        `)
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching material requests:', error);
        throw new Error(`Failed to fetch material requests: ${error.message}`);
      }

      console.log('Fetched material requests:', data);
      return data || [];
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
