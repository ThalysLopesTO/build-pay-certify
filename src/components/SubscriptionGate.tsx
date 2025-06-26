
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { user, isSuperAdmin } = useAuth();
  const { subscriptionStatus, isLoading } = useSubscriptionSync();
  const { toast } = useToast();

  if (isLoading) {
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

  // Check if user has active subscription
  const hasActiveSubscription = subscriptionStatus?.status === 'active';
  
  if (!hasActiveSubscription) {
    console.log('🚨 No active subscription, redirecting to pricing');
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
