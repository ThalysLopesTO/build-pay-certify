
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useJobsites = () => {
  return useQuery({
    queryKey: ['jobsites'],
    queryFn: async () => {
      console.log('Fetching jobsites...');
      const { data, error } = await supabase
        .from('jobsites')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching jobsites:', error);
        throw error;
      }
      console.log('Jobsites fetched:', data);
      return data;
    },
  });
};
