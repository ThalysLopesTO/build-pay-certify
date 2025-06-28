
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { usePlanDetails } from '@/hooks/usePlanDetails';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, CheckCircle, Building, Users, Mail, Crown, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SubscriptionLanding = () => {
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useStripeCheckout();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessingStripeRedirect, setIsProcessingStripeRedirect] = useState(false);
  const { refetch: refetchPlanDetails } = usePlanDetails();
  const { toast } = useToast();

  // Handle Stripe redirect on component mount - ONLY for authenticated users
  useEffect(() => {
    const handleStripeRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const cancelled = urlParams.get('cancelled');
      
      if (cancelled) {
        toast({
          title: "Payment Cancelled",
          description: "Your payment was cancelled. You can try again anytime.",
          variant: "destructive",
        });
        // Clean the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('cancelled');
        window.history.replaceState({}, document.title, url.pathname + url.search);
        return;
      }
      
      if (sessionId && user) {
        console.log('🎉 Stripe checkout session detected for authenticated user:', sessionId);
        setIsProcessingStripeRedirect(true);
        
        try {
          // Clean the URL immediately to prevent re-processing
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          window.history.replaceState({}, document.title, url.pathname + url.search);
          
          console.log('🔄 Verifying subscription status...');
          
          // Add a delay to ensure Stripe webhook has processed
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Create a timeout promise for the refetch operation
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Subscription verification timeout')), 12000)
          );
          
          // Race between refetch and timeout
          const result = await Promise.race([
            refetchPlanDetails(),
            timeoutPromise
          ]);
          
          console.log('✅ Subscription verification completed:', result);
          
          // Show success message
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated. Redirecting to dashboard...",
            variant: "default",
          });
          
          // Wait a moment for the toast to show, then redirect
          await new Promise(resolve => setTimeout(resolve, 1500));
          navigate('/dashboard');
          
        } catch (error) {
          console.error('❌ Error processing Stripe redirect:', error);
          
          if (error instanceof Error && error.message.includes('timeout')) {
            toast({
              title: "Subscription Confirmation Timeout",
              description: "Your payment was processed but verification is taking longer than expected. Please refresh the page or check your dashboard.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Subscription Confirmation Failed",
              description: "There was an issue confirming your subscription. Please refresh the page or contact support if the problem persists.",
              variant: "destructive",
            });
          }
        } finally {
          setIsProcessingStripeRedirect(false);
        }
      }
    };

    handleStripeRedirect();
  }, [refetchPlanDetails, toast, navigate, user]);

  // Add a safety timeout to prevent indefinite loading
  useEffect(() => {
    if (isProcessingStripeRedirect) {
      const safetyTimeout = setTimeout(() => {
        console.warn('⚠️ Safety timeout triggered - releasing processing state');
        setIsProcessingStripeRedirect(false);
        toast({
          title: "Processing Timeout",
          description: "Subscription processing is taking longer than expected. Please refresh the page to check your plan status.",
          variant: "destructive",
        });
      }, 20000); // 20 second safety net

      return () => clearTimeout(safetyTimeout);
    }
  }, [isProcessingStripeRedirect, toast]);

  const handleSubscribe = (planType: 'basic' | 'premium' | 'enterprise') => {
    console.log('🔄 Subscribing to plan:', planType);
    
    if (planType === 'enterprise') {
      const mailtoUrl = 'mailto:sales@stackbuild.ca?subject=Enterprise Plan Inquiry';
      console.log('📧 Redirecting to email for enterprise plan:', mailtoUrl);
      window.location.href = mailtoUrl;
      return;
    }

    // For unauthenticated users, use guest email and set isUnauthenticated flag
    const customerEmail = user?.email || 'guest@stackbuild.ca';
    const isUnauthenticated = !user;

    console.log('💳 Creating checkout session for:', { 
      planType, 
      email: customerEmail, 
      isUnauthenticated 
    });
    
    createCheckout({
      planType,
      customerEmail,
      isUnauthenticated
    });
  };

  // Show loading spinner while processing Stripe redirect for authenticated users
  if (isProcessingStripeRedirect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-slate-800">Verifying Your Subscription</h2>
          <p className="text-slate-600">Please wait while we confirm your payment and activate your plan.</p>
          <p className="text-sm text-slate-500">This usually takes just a few seconds...</p>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsProcessingStripeRedirect(false);
                navigate('/dashboard');
              }}
              className="text-sm"
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'basic',
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
      id: 'premium',
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
      id: 'enterprise',
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
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {user 
              ? "Select the perfect plan for your construction business. Scale up or down as your team grows."
              : "Subscribe now and create your account after payment. Start your construction management journey today."
            }
          </p>
          {!user && (
            <p className="text-sm text-slate-500 mt-2">
              No account required to get started - complete registration after payment
            </p>
          )}
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
                    onClick={() => handleSubscribe(plan.id as 'basic' | 'premium' | 'enterprise')}
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
                        {isCreatingCheckout ? 'Processing...' : plan.buttonText}
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
          {!user && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>New to StackBuild?</strong> Subscribe now, then complete your account registration after payment. 
                Your subscription will be waiting for you!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLanding;
