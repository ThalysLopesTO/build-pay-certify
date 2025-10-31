import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useCancellationRequests } from '@/hooks/useCancellationRequests';
import { useCompanyPlan } from '@/hooks/useCompanyPlan';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrentPlanCard } from './CurrentPlanCard';
import { UpgradeOptions } from './UpgradeOptions';
import { BillingManagement } from './BillingManagement';
import { CancellationSection } from './CancellationSection';

const PlanTab = () => {
  const { isCompanyAdmin } = useAuth();
  const { requests, submitCancellationRequest } = useCancellationRequests();
  const {
    createCheckout,
    isCreatingCheckout,
    openCustomerPortal,
    isOpeningPortal,
    checkSubscription,
    isCheckingSubscription,
  } = useStripeSubscription();
  
  const { data: planData, isLoading: isLoadingPlan, refetch: refetchPlan } = useCompanyPlan();

  // Find pending request for current user's company
  const pendingRequest = requests.find(request => request.status === 'pending');

  const handleUpgrade = (planId: string) => {
    createCheckout({ planId });
  };

  const handleCancellationSubmit = async (notes: string) => {
    await submitCancellationRequest.mutateAsync({ notes });
  };

  const handleRefresh = async () => {
    await checkSubscription();
    await refetchPlan();
  };

  // Only show subscription management for admins
  if (!isCompanyAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only company administrators can manage subscription plans.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading plan details...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!planData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load plan information. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isActive = planData.subscriptionStatus === 'active' || planData.isInTrial;

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isCheckingSubscription}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingSubscription ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Current Plan Card */}
      <CurrentPlanCard planData={planData} />

      {/* Upgrade Options */}
      <UpgradeOptions
        planData={planData}
        onUpgrade={handleUpgrade}
        isUpgrading={isCreatingCheckout}
      />

      {/* Billing Management */}
      <BillingManagement
        onOpenPortal={openCustomerPortal}
        isOpeningPortal={isOpeningPortal}
        isActive={isActive}
      />

      {/* Cancellation Section */}
      <CancellationSection
        onSubmitCancellation={handleCancellationSubmit}
        isSubmitting={submitCancellationRequest.isPending}
        hasPendingRequest={!!pendingRequest}
        pendingRequestDate={pendingRequest?.request_date}
        isActive={isActive}
      />
    </div>
  );
};

export default PlanTab;
