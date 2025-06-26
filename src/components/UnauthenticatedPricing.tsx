
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, CheckCircle, Building, Users, Mail, Crown, Zap } from 'lucide-react';

const UnauthenticatedPricing = () => {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise' | null>(null);
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useStripeCheckout();
  const { toast } = useToast();

  const plans = [
    {
      id: 'basic' as const,
      name: 'Basic Plan',
      price: '$49.90',
      period: '/month',
      employees: '10 Employees',
      icon: Users,
      features: [
        'Up to 10 employees',
        'Basic payroll management',
        'Time tracking & timesheets',
        'Safety certificates tracking',
        'Basic project management',
        'Email support'
      ],
      buttonText: 'Subscribe to Basic',
      popular: false
    },
    {
      id: 'premium' as const,
      name: 'Premium Plan',
      price: '$89.90',
      period: '/month',
      employees: '20 Employees',
      icon: Crown,
      features: [
        'Up to 20 employees',
        'Advanced payroll features',
        'Multi-role access control',
        'Advanced project tracking',
        'Invoice & billing system',
        'Safety template management',
        'Priority support'
      ],
      buttonText: 'Subscribe to Premium',
      popular: true
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Plan',
      price: 'Custom',
      period: 'Pricing',
      employees: 'Unlimited Employees',
      icon: Zap,
      features: [
        'Unlimited employees',
        'Full feature access',
        'Custom integrations',
        'Dedicated account manager',
        'Custom training & onboarding',
        'Priority phone support',
        '99.9% SLA guarantee'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  const handleSubscribe = (planType: 'basic' | 'premium' | 'enterprise') => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to continue with subscription.",
        variant: "destructive",
      });
      return;
    }

    if (planType === 'enterprise') {
      const mailtoUrl = `mailto:sales@yourdomain.com?subject=Enterprise Plan Inquiry&body=Email: ${encodeURIComponent(email)}`;
      window.location.href = mailtoUrl;
      return;
    }

    setSelectedPlan(planType);
    createCheckout({
      planType,
      customerEmail: email,
      isUnauthenticated: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-orange-600 mr-3" />
              <h1 className="text-2xl font-bold text-slate-900">StackBuild</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Select the perfect plan for your construction business. Scale up or down as your team grows.
          </p>
          
          {/* Email Input */}
          <div className="max-w-md mx-auto mb-8">
            <Label htmlFor="email" className="block text-left mb-2 font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email to get started"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
            <p className="text-sm text-slate-500 mt-2 text-left">
              You'll create your account after selecting a plan
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  plan.popular 
                    ? 'border-orange-500 shadow-lg scale-105' 
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.popular ? 'bg-orange-100' : 'bg-slate-100'
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        plan.popular ? 'text-orange-600' : 'text-slate-600'
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-orange-600 mb-1">
                      {plan.price}
                      <span className="text-lg font-normal text-slate-500">{plan.period}</span>
                    </div>
                    <div className="text-slate-600 font-medium">{plan.employees}</div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCreatingCheckout}
                    className={`w-full py-3 ${
                      plan.popular
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    {plan.id === 'enterprise' ? (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        {plan.buttonText}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {isCreatingCheckout && selectedPlan === plan.id ? 'Processing...' : plan.buttonText}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            All plans include a 14-day free trial. No setup fees. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Secure payments with Stripe
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              No long-term contracts
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              24/7 customer support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthenticatedPricing;
