import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNextQuoteNumber = () => {
  return useQuery({
    queryKey: ['next-quote-number'],
    queryFn: async () => {
      // Call the generate_quote_number function to get the next number
      const { data, error } = await supabase.rpc('generate_quote_number');
      
      if (error) throw error;
      return data as string; // Returns "QUO-0001" format
    },
    staleTime: 30000, // Cache for 30 seconds
  });
};
