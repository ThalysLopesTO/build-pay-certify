
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { CreditCard, CheckCircle, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { createCheckout, isCreatingCheckout } = useStripeSubscription();
  const { isAuthenticated } = useAuth();

  const handleStartSubscription = () => {
    if (!isAuthenticated) {
      // User will be redirected to login first
      return;
    }
    
    createCheckout({ 
      priceId: 'price_1RbVmQEuB2J4BS43bsSzcSQM', 
      planName: 'StackBuild' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-orange-200 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold text-orange-600 flex items-center justify-center mb-4">
              <Building className="h-10 w-10 mr-3" />
              StackBuild
            </CardTitle>
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">
              Payroll & Management for Construction Companies
            </h1>
            <p className="text-slate-600 text-lg">
              Streamline your construction business with our comprehensive management platform
            </p>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">$197 CAD</div>
              <div className="text-lg text-slate-600">per month</div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-xl text-center mb-6 text-slate-800">
                Everything You Need to Manage Your Construction Business:
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Unlimited employees',
                  'Payroll & Invoice System',
                  'Certificate & Safety Tracking',
                  'Multi-role Access: Admin, Foreman, Worker',
                  'Project & Jobsite Control',
                  'Material Request Management',
                  'Timesheet Management',
                  'Safety Documentation'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-slate-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              {isAuthenticated ? (
                <Button
                  onClick={handleStartSubscription}
                  disabled={isCreatingCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700 py-4 text-lg font-semibold"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isCreatingCheckout ? 'Processing...' : 'Start My Subscription'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm text-slate-600">
                    Please log in or register to start your subscription
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/login">
                      <Button variant="outline" size="lg" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/register-company">
                      <Button variant="outline" size="lg" className="w-full">
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="text-center text-sm text-slate-500">
                <p className="mb-2">30-day money-back guarantee • Cancel anytime</p>
                <p>Secure payment powered by Stripe</p>
              </div>
            </div>
            
            {isAuthenticated && (
              <div className="text-center pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-3">
                  Already have an account?
                </p>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
