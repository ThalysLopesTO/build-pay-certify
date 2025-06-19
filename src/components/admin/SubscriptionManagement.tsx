
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { CreditCard, RefreshCw, Settings } from 'lucide-react';
import { format } from 'date-fns';

// Example pricing - you can modify these based on your actual Stripe prices
const PRICING_PLANS = [
  {
    name: 'StackBuild',
    priceId: 'price_1RbVmQEuB2J4BS43bsSzcSQM', 
    price: '$197.00',
    features: [
      'Unlimited employees',
      'Payroll & Invoice System',
      'Certificate & Safety Tracking',
      'Multi-role Access: Admin, Foreman, Worker',
      'Project & Jobsite Control'
    ]
  }
];

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

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Current Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className={getPlanColor(getCurrentPlan())}>
                {getCurrentPlan().charAt(0).toUpperCase() + getCurrentPlan().slice(1)} Plan
              </Badge>
              {subscriptionStatus?.subscription_end && (
                <span className="text-sm text-gray-600">
                  Expires: {format(new Date(subscriptionStatus.subscription_end), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkSubscription}
                disabled={isCheckingSubscription}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingSubscription ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
              {subscriptionStatus?.subscribed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCustomerPortal()}
                  disabled={isOpeningPortal}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => {
              const isCurrentPlan = getCurrentPlan().toLowerCase() === plan.name.toLowerCase();
              
              return (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-6 ${
                    isCurrentPlan ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="text-3xl font-bold text-orange-600">{plan.price}</div>
                    <div className="text-sm text-gray-600">per month</div>
                    {isCurrentPlan && (
                      <Badge className="mt-2 bg-orange-600 text-white">Current Plan</Badge>
                    )}
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {!isCurrentPlan && (
                    <Button
                      className="w-full"
                      onClick={() => createCheckout({ priceId: plan.priceId, planName: plan.name })}
                      disabled={isCreatingCheckout}
                    >
                      {getCurrentPlan() === 'free' ? 'Subscribe' : 'Upgrade'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {subscriptionStatus?.subscribed && (
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
