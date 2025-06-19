
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string;
  subscription_end: string | null;
}

export const useStripeSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // Check subscription status - only for authenticated users
  const { data: subscriptionStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!session) throw new Error('No session');
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data as SubscriptionStatus;
    },
    enabled: !!session && !!user,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Create checkout session - works for both authenticated and unauthenticated users
  const createCheckoutMutation = useMutation({
    mutationFn: async ({ priceId, planName }: { priceId: string; planName: string }) => {
      const headers: Record<string, string> = {};
      
      // Add authorization header if user is authenticated
      if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, planName },
        headers,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe checkout in the same tab for better UX
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

  // Open customer portal - requires authentication
  const customerPortalMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Please log in to manage your subscription');
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Portal Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    },
  });

  // Manual subscription check
  const checkSubscription = async () => {
    setIsCheckingSubscription(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription status has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Failed to refresh subscription status",
        variant: "destructive",
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  return {
    subscriptionStatus,
    isLoadingStatus,
    isCheckingSubscription,
    createCheckout: createCheckoutMutation.mutate,
    isCreatingCheckout: createCheckoutMutation.isPending,
    openCustomerPortal: customerPortalMutation.mutate,
    isOpeningPortal: customerPortalMutation.isPending,
    checkSubscription,
  };
};
