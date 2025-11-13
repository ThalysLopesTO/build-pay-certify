import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RespondToChangeRequestParams {
  quoteId: string;
  responseMessage: string;
}

export const useRespondToChangeRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, responseMessage }: RespondToChangeRequestParams) => {
      const { data, error } = await supabase.rpc('respond_to_quote_changes', {
        p_quote_id: quoteId,
        p_response_message: responseMessage,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to send response');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Response Sent',
        description: 'Your response has been sent to the client successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send response to client',
        variant: 'destructive',
      });
    },
  });
};
