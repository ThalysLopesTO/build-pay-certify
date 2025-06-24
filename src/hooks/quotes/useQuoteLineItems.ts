
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuoteLineItem } from './types';

export const useQuoteLineItems = (quoteId: string) => {
  return useQuery({
    queryKey: ['quote-line-items', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data as QuoteLineItem[];
    },
    enabled: !!quoteId,
  });
};
