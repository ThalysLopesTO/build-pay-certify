import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useApproveQuote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ token, signedName }: { token: string; signedName: string }) => {
      const { data, error } = await supabase.rpc('approve_quote_public', {
        p_token: token,
        p_signed_name: signedName
      });
      
      if (error) {
        console.error('Error approving quote:', error);
        throw error;
      }

      // Send admin notification
      try {
        const quoteData = data as any;
        await supabase.functions.invoke('send-quote-notification', {
          body: {
            action: 'approved',
            quoteNumber: quoteData.quote_number,
            clientName: quoteData.client_name,
            projectName: quoteData.project_name,
            companyId: quoteData.company_id,
          },
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal'] });
    },
  });
};

export const useRequestChanges = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ token, message }: { token: string; message: string }) => {
      const { data, error } = await supabase.rpc('request_quote_changes_public', {
        p_token: token,
        p_message: message
      });
      
      if (error) {
        console.error('Error requesting changes:', error);
        throw error;
      }

      // Set the timestamp for when the change was requested
      if (data && (data as any).id) {
        await supabase
          .from('quotes')
          .update({ client_change_requested_at: new Date().toISOString() })
          .eq('id', (data as any).id);
      }

      // Send admin notification
      try {
        const quoteData = data as any;
        await supabase.functions.invoke('send-quote-notification', {
          body: {
            action: 'changes_requested',
            quoteNumber: quoteData.quote_number,
            clientName: quoteData.client_name,
            projectName: quoteData.project_name,
            message: message,
            companyId: quoteData.company_id,
          },
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal'] });
    },
  });
};

export const useDeclineQuote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ token, reason }: { token: string; reason: string }) => {
      const { data, error } = await supabase.rpc('decline_quote_public', {
        p_token: token,
        p_reason: reason
      });
      
      if (error) {
        console.error('Error declining quote:', error);
        throw error;
      }

      // Send admin notification
      try {
        const quoteData = data as any;
        await supabase.functions.invoke('send-quote-notification', {
          body: {
            action: 'declined',
            quoteNumber: quoteData.quote_number,
            clientName: quoteData.client_name,
            projectName: quoteData.project_name,
            message: reason,
            companyId: quoteData.company_id,
          },
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal'] });
    },
  });
};
