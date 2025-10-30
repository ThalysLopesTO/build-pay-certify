
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { CreditCard, CheckCircle, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

const SubscriptionLanding = () => {
  const { createCheckout, isCreatingCheckout } = useStripeSubscription();

  const handleSubscribe = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    createCheckout({ planName: plan.displayName, planId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-slate-300">All plans include a 7-day free trial</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <Card key={plan.id} className={plan.popular ? 'border-2 border-orange-500' : ''}>
              <CardHeader className="text-center relative">
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </CardTitle>
                <div className="text-4xl font-bold text-orange-600 mb-1">{plan.priceDisplay}</div>
                <div className="text-sm text-slate-600">per month</div>
                <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  🎉 7-Day Free Trial
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.featureList.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCreatingCheckout}
                  className={`w-full py-3 ${
                    plan.popular 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isCreatingCheckout ? 'Processing...' : 'Start Free Trial'}
                </Button>
                
                <p className="text-xs text-center text-slate-500">
                  No charge for 7 days. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs text-slate-300 mb-2">
            Already have an account?
          </p>
          <Link to="/admin-login">
            <Button variant="outline" size="sm" className="bg-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLanding;
