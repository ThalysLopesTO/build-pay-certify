
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
      
      // First, let's try a simpler query without any joins to see if the basic query works
      const { data, error } = await supabase
        .from('material_requests')
        .select('*')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching material requests:', error);
        throw new Error(`Failed to fetch material requests: ${error.message}`);
      }

      console.log('Fetched material requests (basic):', data);

      // If we have data, let's get the jobsite information separately
      if (data && data.length > 0) {
        const jobsiteIds = [...new Set(data.map(request => request.jobsite_id))];
        
        const { data: jobsites, error: jobsiteError } = await supabase
          .from('jobsites')
          .select('id, name, address')
          .in('id', jobsiteIds);

        if (jobsiteError) {
          console.error('Error fetching jobsites:', jobsiteError);
          // Return the material requests without jobsite data if jobsite fetch fails
          return data.map(request => ({
            ...request,
            jobsites: null
          }));
        }

        // Merge the jobsite data with material requests
        const enrichedData = data.map(request => {
          const jobsite = jobsites.find(j => j.id === request.jobsite_id);
          return {
            ...request,
            jobsites: jobsite || null
          };
        });

        console.log('Enriched material requests:', enrichedData);
        return enrichedData;
      }

      return data || [];
    },
    enabled: !!user?.id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
