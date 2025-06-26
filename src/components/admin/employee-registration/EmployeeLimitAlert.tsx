
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface EmployeeLimitAlertProps {
  employeeLimit: {
    plan: string;
    currentCount: number;
    employeeLimit: number | null;
    canAddEmployee: boolean;
    remainingSlots: number;
  };
}

const EmployeeLimitAlert: React.FC<EmployeeLimitAlertProps> = ({ employeeLimit }) => {
  const { user } = useAuth();
  const checkoutMutation = useStripeCheckout();

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'basic': return 'Basic Plan';
      case 'premium': return 'Premium Plan';
      case 'enterprise': return 'Enterprise Plan';
      default: return plan;
    }
  };

  const handleUpgrade = (planType: 'premium' | 'enterprise') => {
    if (user?.email) {
      checkoutMutation.mutate({
        planType,
        customerEmail: user.email,
      });
    }
  };

  if (employeeLimit.canAddEmployee) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Crown className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong>Current Plan: {getPlanName(employeeLimit.plan)}</strong> - 
          Using {employeeLimit.currentCount} of {employeeLimit.employeeLimit || '∞'} employee slots.
          <span className="text-green-600"> You can add {employeeLimit.remainingSlots} more employees.</span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <strong>Employee Limit Reached</strong>
            <br />
            You're using {employeeLimit.currentCount} of {employeeLimit.employeeLimit} employees on the {getPlanName(employeeLimit.plan)}.
          </div>
          <div className="flex space-x-2 ml-4">
            {employeeLimit.plan === 'basic' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleUpgrade('premium')}
                  disabled={checkoutMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Upgrade to Premium
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={checkoutMutation.isPending}
                >
                  Contact for Enterprise
                </Button>
              </>
            )}
            {employeeLimit.plan === 'premium' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpgrade('enterprise')}
                disabled={checkoutMutation.isPending}
              >
                Contact for Enterprise
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EmployeeLimitAlert;
