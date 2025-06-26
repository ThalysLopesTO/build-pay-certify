
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CheckoutParams {
  planType: 'basic' | 'premium' | 'enterprise';
  customerEmail: string;
}

export const useStripeCheckout = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ planType, customerEmail }: CheckoutParams) => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType, customerEmail },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.redirectTo) {
        // For enterprise plan
        window.location.href = data.redirectTo;
      } else if (data.url) {
        // For other plans
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });
};
