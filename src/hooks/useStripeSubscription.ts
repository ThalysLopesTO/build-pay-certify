
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

      if (error) {
        // If authentication error, the session is invalid - disable further checks
        if (error.message?.includes('Authentication error') || error.message?.includes('Session')) {
          console.error('Invalid session detected, please log in again');
          throw new Error('SESSION_INVALID');
        }
        throw error;
      }
      return data as SubscriptionStatus;
    },
    enabled: !!session && !!user,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message === 'SESSION_INVALID') return false;
      return failureCount < 2;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Create checkout session - now supports guest checkout
  const createCheckoutMutation = useMutation({
    mutationFn: async ({ planName, customerEmail }: { planName: string; customerEmail?: string }) => {
      console.log('Creating checkout session with params:', { planName, customerEmail });
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planName, customerEmail },
      });

      if (error) {
        console.error('Checkout creation error:', error);
        throw error;
      }
      
      console.log('Checkout session created:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Checkout success, redirecting to:', data.url);
      if (data.url) {
        // Redirect to Stripe checkout in the same tab for better UX
          // window.location.assign(data.url);
           window.open(data.url, '_blank')
      } else {
        throw new Error('No checkout URL received');
      }
    },
    onError: (error: any) => {
      console.error('Checkout mutation error:', error);
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
