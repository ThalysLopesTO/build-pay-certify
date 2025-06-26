
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CheckoutParams {
  planType: 'basic' | 'premium' | 'enterprise';
  customerEmail?: string;
  isUnauthenticated?: boolean;
}

interface CheckoutResponse {
  url?: string;
  redirectTo?: string;
}

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_end?: string;
  status?: string;
}

export const useStripeSubscription = () => {
  const { toast } = useToast();

  // Query for subscription status
  const { data: subscriptionStatus, isLoading: isLoadingStatus, refetch: checkSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const createCheckout = useMutation<CheckoutResponse, Error, CheckoutParams>({
    mutationFn: async ({ planType, customerEmail = '', isUnauthenticated = false }: CheckoutParams): Promise<CheckoutResponse> => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planType, 
          customerEmail, 
          isUnauthenticated,
          successUrl: `${window.location.origin}/register`,
          cancelUrl: `${window.location.origin}/pricing`
        },
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

  const openCustomerPortal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Portal Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    },
  });

  return {
    subscriptionStatus,
    isLoadingStatus,
    isCheckingSubscription: checkSubscription.isFetching,
    createCheckout: createCheckout.mutate,
    isCreatingCheckout: createCheckout.isPending,
    openCustomerPortal: openCustomerPortal.mutate,
    isOpeningPortal: openCustomerPortal.isPending,
    checkSubscription,
  };
};
