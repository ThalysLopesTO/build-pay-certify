
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuoteLineItem } from './types';

export const useCreateQuoteLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lineItem: Omit<QuoteLineItem, 'id' | 'created_at' | 'updated_at' | 'amount'>) => {
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
