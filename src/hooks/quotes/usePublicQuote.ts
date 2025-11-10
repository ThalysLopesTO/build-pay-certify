import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quote, QuoteLineItem } from './types';

interface PublicQuoteData {
  quote: Quote;
  line_items: QuoteLineItem[];
  company_settings: {
    company_name: string;
    company_address: string | null;
    company_phone: string | null;
    company_email: string | null;
    hst_number: string | null;
    company_logo_url: string | null;
  };
  company_logo: string | null;
}

export const usePublicQuote = (token: string) => {
  return useQuery({
    queryKey: ['public-quote', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_quote', {
        token_param: token
      });

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return data as PublicQuoteData;
    },
    enabled: !!token,
    retry: false,
  });
};

export const useMarkQuoteViewed = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('mark_quote_viewed', {
        token_param: token
      });

      if (error) {
        throw error;
      }

      return data;
    },
  });
};
