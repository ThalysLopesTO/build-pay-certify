
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CheckoutParams {
  planType: 'basic' | 'premium' | 'enterprise';
  customerEmail: string;
  isUnauthenticated?: boolean;
}

interface CheckoutResponse {
  url?: string;
  redirectTo?: string;
}

export const useStripeCheckout = () => {
  const { toast } = useToast();

  return useMutation<CheckoutResponse, Error, CheckoutParams>({
    mutationFn: async ({ planType, customerEmail, isUnauthenticated = false }: CheckoutParams): Promise<CheckoutResponse> => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType, customerEmail, isUnauthenticated },
      });

      if (error) throw new Error(error.message);
      return data as CheckoutResponse;
    },
    onSuccess: (data) => {
      if (data.redirectTo) {
        window.location.href = data.redirectTo; // Enterprise plan
      } else if (data.url) {
        window.location.href = data.url; // Basic or Premium
      }
    },
    onError: (error) => {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });
};
