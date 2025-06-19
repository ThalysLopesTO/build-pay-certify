import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const { subscriptionStatus, isLoadingStatus, createCheckout, isCreatingCheckout } = useStripeSubscription();

  const handleSubscribe = () => {
    createCheckout({ planName: 'StackBuild' });
  };

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus?.subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-orange-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6 mr-2" />
                StackBuild
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription has expired. Please renew to continue using StackBuild.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">StackBuild Plan</h3>
                  <p className="text-2xl font-bold text-orange-600">$197 CAD/month</p>
                </div>
                
                <ul className="text-sm text-left space-y-1">
                  <li>• Unlimited employees</li>
                  <li>• Payroll & Invoice System</li>
                  <li>• Certificate & Safety Tracking</li>
                  <li>• Multi-role Access: Admin, Foreman, Worker</li>
                  <li>• Project & Jobsite Control</li>
                </ul>
                
                <Button
                  onClick={handleSubscribe}
                  disabled={isCreatingCheckout}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isCreatingCheckout ? 'Processing...' : 'Renew Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
