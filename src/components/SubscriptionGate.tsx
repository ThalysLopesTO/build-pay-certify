
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { user, isSuperAdmin } = useAuth();
  const { subscriptionStatus, isLoading } = useSubscriptionSync();
  const { toast } = useToast();

  // Check for company subscription override or legacy plan
  const { data: companyOverride, isLoading: isLoadingOverride } = useQuery({
    queryKey: ['company-override', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) return null;
      
      const { data } = await supabase
        .from('companies')
        .select('subscription_override, status, plan, plan_type')
        .eq('id', user.company_id)
        .single();
        
      return data;
    },
    enabled: !!user?.company_id,
  });

  if (isLoading || isLoadingOverride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Super admins bypass subscription requirements
  if (isSuperAdmin) {
    console.log('✅ Super admin access granted');
    return <>{children}</>;
  }

  // Companies with subscription override bypass subscription requirements
  if (companyOverride?.subscription_override) {
    console.log('✅ Company subscription override active, granting access');
    return <>{children}</>;
  }

  // Check for legacy/test users with active status and plan
  if (companyOverride?.status === 'active' && companyOverride?.plan && companyOverride.plan !== 'free') {
    console.log('✅ Legacy/test user with active plan, granting access');
    return <>{children}</>;
  }

  // Check if user has active subscription
  const hasActiveSubscription = subscriptionStatus?.status === 'active';
  
  if (!hasActiveSubscription) {
    console.log('🚨 No active subscription or valid plan, redirecting to pricing');
    toast({
      title: "Subscription Required",
      description: "You need a valid subscription to access the platform.",
      variant: "destructive",
    });
    return <Navigate to="/pricing" replace />;
  }

  console.log('✅ Active subscription confirmed, granting access');
  return <>{children}</>;
};

export default SubscriptionGate;
