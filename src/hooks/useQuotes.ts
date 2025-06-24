
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Quote {
  id: string;
  company_id: string;
  quote_number: string;
  client_name: string;
  client_company?: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  project_name: string;
  quote_date: string;
  expiry_date?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  subtotal: number;
  tax: number;
  discount: number;
  total_amount: number;
  notes?: string;
  sent_date?: string;
  accepted_date?: string;
  declined_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  description: string;
  vendor?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

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

export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteData: Partial<Quote>) => {
      const { data, error } = await supabase
        .from('quotes')
        .insert([{
          ...quoteData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          company_id: (await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .single()
          ).data?.company_id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Success",
        description: "Quote created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create quote: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Quote> }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Success",
        description: "Quote updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update quote: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete quote: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useCreateQuoteLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lineItem: Partial<QuoteLineItem>) => {
      const { data, error } = await supabase
        .from('quote_line_items')
        .insert([lineItem])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as QuoteLineItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-line-items', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};

export const useUpdateQuoteLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QuoteLineItem> }) => {
      const { data, error } = await supabase
        .from('quote_line_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as QuoteLineItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-line-items', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};

export const useDeleteQuoteLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quoteId }: { id: string; quoteId: string }) => {
      const { error } = await supabase
        .from('quote_line_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return quoteId;
    },
    onSuccess: (quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quote-line-items', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};
