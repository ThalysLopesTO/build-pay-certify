
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star } from 'lucide-react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const PricingPage = () => {
  const { user } = useAuth();
  const checkoutMutation = useStripeCheckout();

  const plans = [
    {
      type: 'basic' as const,
      name: 'Basic Plan',
      price: '$49.90',
      period: '/month',
      employeeLimit: '10 employees',
      popular: false,
      features: [
        'Up to 10 employees',
        'Basic payroll features',
        'Timesheet management',
        'Standard support',
        'Basic reporting'
      ]
    },
    {
      type: 'premium' as const,
      name: 'Premium Plan',
      price: '$89.90',
      period: '/month',
      employeeLimit: '20 employees',
      popular: true,
      features: [
        'Up to 20 employees',
        'Advanced payroll features',
        'Advanced timesheet management',
        'Priority support',
        'Advanced reporting',
        'Custom integrations'
      ]
    },
    {
      type: 'enterprise' as const,
      name: 'Enterprise Plan',
      price: 'Custom',
      period: '',
      employeeLimit: 'Unlimited employees',
      popular: false,
      features: [
        'Unlimited employees',
        'Custom features',
        'Dedicated support',
        'API access',
        'Custom integrations',
        'On-premise deployment'
      ]
    }
  ];

  const handleSelectPlan = (planType: 'basic' | 'premium' | 'enterprise') => {
    if (user?.email) {
      checkoutMutation.mutate({
        planType,
        customerEmail: user.email,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select the perfect plan for your business. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.type}
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : 'border-slate-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold flex items-center justify-center">
                  {plan.type === 'enterprise' && <Crown className="h-6 w-6 mr-2 text-yellow-500" />}
                  {plan.name}
                </CardTitle>
                <div className="text-4xl font-bold text-slate-900">
                  {plan.price}
                  <span className="text-lg font-normal text-slate-600">{plan.period}</span>
                </div>
                <p className="text-slate-600">{plan.employeeLimit}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                  onClick={() => handleSelectPlan(plan.type)}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Processing...' : 
                   plan.type === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
