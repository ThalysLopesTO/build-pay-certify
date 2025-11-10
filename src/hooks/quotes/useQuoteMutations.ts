import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Quote } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to keep public_status in sync with internal status
const syncPublicStatus = (internalStatus: string): 'awaiting_response' | 'changes_requested' | 'approved' | 'declined' => {
  switch (internalStatus) {
    case 'accepted':
      return 'approved';
    case 'declined':
      return 'declined';
    case 'sent':
      return 'awaiting_response';
    case 'draft':
      return 'awaiting_response';
    default:
      return 'awaiting_response';
  }
};

// Helper to ensure public_token exists when sending quotes
const ensurePublicToken = (updates: Partial<Quote>): Partial<Quote> => {
  // If we're marking as 'sent' and there's no public_token, generate one
  if (updates.status === 'sent' && !updates.public_token) {
    return {
      ...updates,
      public_token: uuidv4(),
    };
  }
  return updates;
};

export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteData: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'created_by'>) => {
      const user = await supabase.auth.getUser();
      const userProfile = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', user.data.user?.id)
        .single();

      const { data, error } = await supabase
        .from('quotes')
        .insert([{
          ...quoteData,
          created_by: user.data.user?.id!,
          company_id: userProfile.data?.company_id!
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
      // Ensure public_token exists when sending
      let finalUpdates = ensurePublicToken({ ...updates });
      
      // Auto-sync public_status if internal status is being changed
      if (updates.status && !updates.public_status) {
        finalUpdates.public_status = syncPublicStatus(updates.status);
      }

      const { data, error } = await supabase
        .from('quotes')
        .update({ ...finalUpdates, updated_at: new Date().toISOString() })
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
