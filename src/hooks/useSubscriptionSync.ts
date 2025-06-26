import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SubscriptionStatus {
  status: string;
  plan_type: string;
  employee_limit: number | null;
  current_period_end?: number;
}

interface SyncResponse {
  success: boolean;
  subscription: SubscriptionStatus;
  needsSubscription: boolean;
  message?: string;
}

export const useSubscriptionSync = () => {
  const { user, session, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Sync subscription with Stripe
  const syncMutation = useMutation({
    mutationFn: async (): Promise<SyncResponse> => {
      if (!session) throw new Error('No session');
      
      console.log('🔄 Starting subscription sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-stripe-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Sync error:', error);
        throw error;
      }
      
      console.log('✅ Sync response:', data);
      return data;
    },
    onSuccess: (data: SyncResponse) => {
      console.log('📊 Subscription sync successful:', data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['employee-limit'] });
      queryClient.invalidateQueries({ queryKey: ['plan-details'] });
      
      // Handle redirection based on subscription status
      if (data.needsSubscription && !isSuperAdmin) {
        console.log('🚨 User needs subscription, redirecting to pricing');
        toast({
          title: "Subscription Required",
          description: "You need a valid subscription to access the platform.",
          variant: "destructive",
        });
        navigate('/pricing');
      } else if (data.subscription.status === 'active' || isSuperAdmin) {
        console.log('✅ Active subscription confirmed');
        if (window.location.pathname === '/login' || window.location.pathname === '/pricing') {
          navigate('/dashboard');
        }
      }
    },
    onError: (error: any) => {
      console.error('💥 Subscription sync failed:', error);
      toast({
        title: "Subscription Check Failed",
        description: "Unable to verify subscription status. Please try again.",
        variant: "destructive",
      });
      
      // On error, assume needs subscription unless super admin
      if (!isSuperAdmin) {
        navigate('/pricing');
      }
    },
  });

  // Get cached subscription status
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!user?.companyId) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', user.companyId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-sync on login or every 24 hours
  const shouldAutoSync = session && user && (
    !subscriptionStatus || 
    new Date(subscriptionStatus.updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000
  );

  // Auto-sync if needed
  React.useEffect(() => {
    if (shouldAutoSync && !syncMutation.isPending) {
      console.log('🔄 Auto-syncing subscription...');
      syncMutation.mutate();
    }
  }, [shouldAutoSync]);

  return {
    subscriptionStatus,
    isLoading: isLoading || syncMutation.isPending,
    syncSubscription: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    error: syncMutation.error,
  };
};
