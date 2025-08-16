import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, CheckCircle, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SubscriptionPlanPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { createCheckout, isCreatingCheckout } = useStripeSubscription();
  const navigate = useNavigate();

  // Redirect authenticated users with active subscription to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has active subscription
      const checkSubscription = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('check-subscription');
          if (error) throw error;
          
          if (data?.subscribed) {
            navigate('/admin/dashboard');
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      };
      
      checkSubscription();
    }
  }, [isAuthenticated, user, navigate]);

  const handleStartBasicSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planName: 'Basic',
          customerEmail: user?.email 
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    }
  };

  const handleStartPremiumSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planName: 'Premium',
          customerEmail: user?.email 
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Building className="h-12 w-12 text-orange-500 mr-4" />
            <h1 className="text-4xl font-bold text-white">StackBuild</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Choose Your Construction Management Plan
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Streamline your construction projects with our comprehensive management platform. 
            Track time, manage employees, monitor jobsites, and handle invoicing all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Basic Plan */}
          <Card className="border-2 border-slate-600 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-white mb-2">Basic</CardTitle>
              <div className="text-4xl font-bold text-orange-500 mb-4">$49/mo</div>
              <p className="text-slate-300">Perfect for small teams getting started</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 15 employees',
                  'Time tracking & timesheets',
                  'Basic jobsite management',
                  'Employee management',
                  'Mobile app access',
                  'Email support'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={handleStartBasicSubscription}
                disabled={isCreatingCheckout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {isCreatingCheckout ? 'Processing...' : 'Start Basic Plan'}
              </Button>
              {isAuthenticated && (
                <div className="mt-4 text-center">
                  <Link to="/admin-login" className="text-orange-400 hover:text-orange-300 text-sm">
                    Already have an account? Sign in
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-orange-500 bg-gradient-to-b from-orange-500/10 to-slate-800/50 backdrop-blur-sm relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </span>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold text-white mb-2">Premium</CardTitle>
              <div className="text-4xl font-bold text-orange-500 mb-4">$99/mo</div>
              <p className="text-slate-300">For growing construction businesses</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 50 employees',
                  'Advanced time tracking',
                  'Complete jobsite management',
                  'Material requests & tracking',
                  'Invoice & quote generation',
                  'Daily reports & analytics',
                  'Priority email support',
                  'Advanced reporting'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={handleStartPremiumSubscription}
                disabled={isCreatingCheckout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {isCreatingCheckout ? 'Processing...' : 'Start Premium Plan'}
              </Button>
              {isAuthenticated && (
                <div className="mt-4 text-center">
                  <Link to="/admin-login" className="text-orange-400 hover:text-orange-300 text-sm">
                    Already have an account? Sign in
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-2 border-slate-600 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-white mb-2">Enterprise</CardTitle>
              <div className="text-4xl font-bold text-orange-500 mb-4">Custom</div>
              <p className="text-slate-300">For large construction companies</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited employees',
                  'Custom integrations',
                  'Advanced analytics & reporting',
                  'Dedicated account manager',
                  'Custom training & onboarding',
                  'Priority phone support',
                  'Custom feature development',
                  'SLA guarantees'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold py-3"
              >
                Contact Sales
              </Button>
              {isAuthenticated && (
                <div className="mt-4 text-center">
                  <Link to="/admin-login" className="text-orange-400 hover:text-orange-300 text-sm">
                    Already have an account? Sign in
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-slate-400 mb-4">Already have an account?</p>
          <div className="space-x-4">
            <Link to="/admin-login">
              <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                Company Login
              </Button>
            </Link>
            <Link to="/employee-login">
              <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                Employee Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanPage;