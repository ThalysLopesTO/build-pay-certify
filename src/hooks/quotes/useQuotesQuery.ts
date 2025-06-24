
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quote } from './types';

export const useQuotes = (filters?: { status?: string; client_name?: string; date_from?: string; date_to?: string }) => {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.client_name) {
        query = query.ilike('client_name', `%${filters.client_name}%`);
      }

      if (filters?.date_from) {
        query = query.gte('quote_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('quote_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Quote[];
    },
  });
};
