import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { CreditCard, RefreshCw, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Single pricing plan configuration
const STACKBUILD_PLAN = {
  name: 'StackBuild',
  price: '$197 CAD',
  features: [
    'Unlimited employees',
    'Payroll & Invoice System',
    'Certificate & Safety Tracking',
    'Multi-role Access: Admin, Foreman, Worker',
    'Project & Jobsite Control'
  ]
};

const SubscriptionManagement = () => {
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

  const handleRenewSubscription = () => {
    createCheckout({ planName: STACKBUILD_PLAN.name });
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading subscription status...</p>
        </div>
      </div>
    );
  }

  const isSubscribed = subscriptionStatus?.subscribed || false;

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Current Subscription</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSubscription}
              disabled={isCheckingSubscription}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingSubscription ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge className={isSubscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {isSubscribed ? 'StackBuild Plan - Active' : 'Subscription Required'}
                </Badge>
                <span className="text-lg font-semibold text-orange-600">
                  {STACKBUILD_PLAN.price}/month
                </span>
              </div>
              {subscriptionStatus?.subscription_end && (
                <span className="text-sm text-gray-600">
                  {isSubscribed ? 'Renews' : 'Expired'}: {format(new Date(subscriptionStatus.subscription_end), 'MMM dd, yyyy')}
                </span>
              )}
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Plan Features:</h4>
              <ul className="space-y-1">
                {STACKBUILD_PLAN.features.map((feature, index) => (
                  <li key={index} className="text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-2 pt-4">
              {isSubscribed ? (
                <Button
                  variant="outline"
                  onClick={() => openCustomerPortal()}
                  disabled={isOpeningPortal}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  onClick={handleRenewSubscription}
                  disabled={isCreatingCheckout}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isCreatingCheckout ? 'Processing...' : 'Subscribe Now'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Required Alert */}
      {!isSubscribed && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700">Subscription Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                A StackBuild subscription is required to access all features. Subscribe now to continue using the system.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Billing & Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Access your billing history, download invoices, and update payment methods through the customer portal.
            </p>
            <Button
              variant="outline"
              onClick={() => openCustomerPortal()}
              disabled={isOpeningPortal}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Open Billing Portal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManagement;
