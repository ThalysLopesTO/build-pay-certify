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
      console.log('Fetching public quote with token:', token);
      
      const { data, error } = await supabase.rpc('get_public_quote', {
        token_param: token
      });

      if (error) {
        console.error('Error fetching public quote:', error);
        throw error;
      }

      if (!data) {
        console.warn('No quote found for token:', token);
        return null;
      }

      console.log('Successfully fetched quote:', data);
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

// Hook to fetch other quotes for the same client
export const useClientOtherQuotes = (
  clientEmail: string, 
  companyId: string, 
  currentQuoteId: string
) => {
  return useQuery({
    queryKey: ['client-other-quotes', clientEmail, companyId, currentQuoteId],
    queryFn: async () => {
      console.log('Fetching other quotes for client:', clientEmail);
      
      const { data, error } = await supabase
        .from('quotes')
        .select('id, quote_number, project_name, quote_date, status, total_amount, public_status, public_token')
        .eq('client_email', clientEmail)
        .eq('company_id', companyId)
        .neq('id', currentQuoteId)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching client other quotes:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!clientEmail && !!companyId && !!currentQuoteId,
  });
};

// Hook to fetch invoices for the same client
export const useClientInvoices = (
  clientEmail: string,
  companyId: string
) => {
  return useQuery({
    queryKey: ['client-invoices', clientEmail, companyId],
    queryFn: async () => {
      console.log('Fetching invoices for client:', clientEmail);
      
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, title, due_date, status, total_amount, created_at')
        .eq('client_email', clientEmail)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching client invoices:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!clientEmail && !!companyId,
  });
};
