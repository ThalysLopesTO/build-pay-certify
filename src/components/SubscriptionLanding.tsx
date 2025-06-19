
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { CreditCard, CheckCircle, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

const SubscriptionLanding = () => {
  const { createCheckout, isCreatingCheckout } = useStripeSubscription();

  const handleSubscribe = () => {
    createCheckout({ priceId: 'price_1RbVmQEuB2J4BS43bsSzcSQM', planName: 'StackBuild' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-orange-600 flex items-center justify-center mb-2">
              <Building className="h-8 w-8 mr-2" />
              StackBuild
            </CardTitle>
            <p className="text-slate-600">Construction Payroll & Project Management</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">$197 CAD</div>
              <div className="text-sm text-slate-600">per month</div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-center mb-3">Everything You Need:</h3>
              <ul className="space-y-2">
                {[
                  'Unlimited employees',
                  'Payroll & Invoice System',
                  'Certificate & Safety Tracking',
                  'Multi-role Access: Admin, Foreman, Worker',
                  'Project & Jobsite Control'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button
              onClick={handleSubscribe}
              disabled={isCreatingCheckout}
              className="w-full bg-orange-600 hover:bg-orange-700 py-3"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isCreatingCheckout ? 'Processing...' : 'Subscribe to Start'}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">
                Already have an account?
              </p>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionLanding;
