
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSafetyTemplates = () => {
  return useQuery({
    queryKey: ['safety-templates'],
    queryFn: async () => {
      console.log('🔍 Fetching safety templates...');
      
      const { data, error } = await supabase
        .from('safety_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching safety templates:', error);
        throw error;
      }

      console.log('✅ Safety templates fetched:', data?.length || 0);
      return data || [];
    },
  });
};
