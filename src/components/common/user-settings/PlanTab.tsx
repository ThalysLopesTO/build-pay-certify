
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useCancellationRequests } from '@/hooks/useCancellationRequests';
import { CreditCard, AlertCircle, Settings, RefreshCw, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Pricing plans configuration
const PRICING_PLANS = [
  {
    name: 'Basic',
    priceId: 'price_basic_monthly',
    price: '$29',
    features: [
      'Up to 10 employees',
      'Basic payroll system',
      'Essential reporting',
      'Email support'
    ]
  },
  {
    name: 'Standard',
    priceId: 'price_standard_monthly',
    price: '$79',
    features: [
      'Up to 50 employees',
      'Advanced payroll & invoicing',
      'Certificate tracking',
      'Priority support'
    ]
  },
  {
    name: 'Pro',
    priceId: 'price_pro_monthly',
    price: '$149',
    features: [
      'Unlimited employees',
      'Full project management',
      'Advanced analytics',
      'Phone & email support'
    ]
  }
];

const PlanTab = () => {
  const { user, isCompanyAdmin } = useAuth();
  const { requests, submitCancellationRequest } = useCancellationRequests();
  const {
    subscriptionStatus,
    isLoadingStatus,
    isCheckingSubscription,
    createCheckout,
    isCreatingCheckout,
    openCustomerPortal,
    isOpeningPortal,
    checkSubscription,
  } = useStripeSubscription();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Find pending request for current user's company
  const pendingRequest = requests.find(request => request.status === 'pending');

  const handleCancellationSubmit = async () => {
    await submitCancellationRequest.mutateAsync({ notes });
    setIsDialogOpen(false);
    setNotes('');
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'standard': return 'bg-green-100 text-green-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentPlan = () => {
    return subscriptionStatus?.plan || 'free';
  };

  const getCurrentPlanDetails = () => {
    const currentPlan = getCurrentPlan();
    return PRICING_PLANS.find(plan => plan.name.toLowerCase() === currentPlan.toLowerCase());
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

  if (isLoadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Checking subscription status...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = getCurrentPlan();
  const currentPlanDetails = getCurrentPlanDetails();
  const isSubscribed = subscriptionStatus?.subscribed || false;

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Current Plan</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSubscription}
              disabled={isCheckingSubscription}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingSubscription ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge className={getPlanColor(currentPlan)}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                </Badge>
                {currentPlanDetails && (
                  <span className="text-lg font-semibold text-orange-600">
                    {currentPlanDetails.price}/month
                  </span>
                )}
              </div>
              {subscriptionStatus?.subscription_end && (
                <span className="text-sm text-muted-foreground">
                  {isSubscribed ? 'Renews' : 'Expires'}: {format(new Date(subscriptionStatus.subscription_end), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
            
            {currentPlanDetails && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Plan Features:</h4>
                <ul className="space-y-1">
                  {currentPlanDetails.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isSubscribed && (
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => openCustomerPortal()}
                  disabled={isOpeningPortal}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans for Upgrade/Downgrade */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentPlan === 'free' ? 'Choose a plan to get started' : 'Upgrade or change your current plan'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => {
              const isCurrentPlan = currentPlan.toLowerCase() === plan.name.toLowerCase();
              
              return (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-4 ${
                    isCurrentPlan ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-3">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <div className="text-2xl font-bold text-orange-600">{plan.price}</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                    {isCurrentPlan && (
                      <Badge className="mt-2 bg-orange-600 text-white">Current Plan</Badge>
                    )}
                  </div>
                  
                  <ul className="space-y-1 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-xs flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {!isCurrentPlan && (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => createCheckout({ priceId: plan.priceId, planName: plan.name })}
                      disabled={isCreatingCheckout}
                    >
                      {currentPlan === 'free' ? 'Subscribe' : 'Change Plan'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Section */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Plan Cancellation</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequest ? (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Cancellation request pending review</span>
                  <span className="text-xs text-orange-600">
                    Submitted {new Date(pendingRequest.request_date).toLocaleDateString()}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Need to cancel your subscription? Submit a cancellation request for review.
              </p>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Cancel My Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Your Plan</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel your plan? Your access will end at the end of your billing cycle.
                      This action requires approval from our team.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Reason for cancellation (optional)
                      </label>
                      <Textarea
                        placeholder="Please let us know why you're cancelling..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitCancellationRequest.isPending}
                    >
                      Keep Plan
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancellationSubmit}
                      disabled={submitCancellationRequest.isPending}
                    >
                      {submitCancellationRequest.isPending ? 'Submitting...' : 'Submit Cancellation Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanTab;
