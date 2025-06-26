
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useLicenseStatus } from '@/hooks/useLicenseStatus';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { subscriptionStatus, isLoadingStatus, createCheckout, isCreatingCheckout } = useStripeSubscription();
  const { data: licenseStatus, isLoading: isLoadingLicense } = useLicenseStatus();
  const { user, isCompanyAdmin } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = () => {
    toast({
      title: "Subscription Required",
      description: "You need a valid subscription to access the platform. Redirecting to pricing...",
      variant: "destructive",
    });
    
    setTimeout(() => {
      window.location.href = '/pricing';
    }, 2000);
  };

  if (isLoadingStatus || isLoadingLicense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Determine if user has access based on role and subscription status
  const hasActiveSubscription = subscriptionStatus?.subscribed || licenseStatus?.isActive;
  
  // For employees, grant access if company has any active subscription
  if (!isCompanyAdmin && hasActiveSubscription) {
    return <>{children}</>;
  }

  // For admins, check both Stripe and legacy subscription status
  if (isCompanyAdmin && hasActiveSubscription) {
    return <>{children}</>;
  }

  // No active subscription found - redirect to pricing
  return <Navigate to="/pricing" replace />;
};

export default SubscriptionGate;
