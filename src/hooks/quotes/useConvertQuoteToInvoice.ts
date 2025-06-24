
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useConvertQuoteToInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.rpc('convert_quote_to_invoice', {
        quote_id_param: quoteId
      });

      if (error) {
        throw error;
      }

      return data as string; // Returns the new invoice ID
    },
    onSuccess: (invoiceId, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Success",
        description: "Quote successfully converted to invoice",
      });
      
      // Navigate to invoice management with the new invoice
      window.location.href = `/admin?tab=invoices&invoice=${invoiceId}`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to convert quote: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
