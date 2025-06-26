
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanDetails } from '@/hooks/usePlanDetails';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { CreditCard, Users, Calendar, AlertTriangle } from 'lucide-react';

const BillingTab = () => {
  const { user } = useAuth();
  const { data: planDetails, isLoading } = usePlanDetails();
  const checkoutMutation = useStripeCheckout();
  const { toast } = useToast();

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Portal Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!planDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Unable to load plan details.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Current Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{planDetails.planName}</h3>
              {planDetails.priceMonthly && (
                <p className="text-slate-600">${planDetails.priceMonthly}/month</p>
              )}
            </div>
            {getStatusBadge(planDetails.subscriptionStatus)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-600">Employee Usage</p>
                <p className="font-medium">
                  {planDetails.currentEmployeeCount} of {planDetails.employeeLimit || '∞'} employees
                </p>
              </div>
            </div>

            {planDetails.subscriptionEndDate && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Next Billing Date</p>
                  <p className="font-medium">
                    {new Date(planDetails.subscriptionEndDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {planDetails.subscriptionStatus === 'active' ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={openCustomerPortal}
                className="w-full"
              >
                Manage Billing & Payment Methods
              </Button>
              
              {planDetails.planType === 'basic' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleUpgrade('premium')}
                    disabled={checkoutMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Upgrade to Premium Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpgrade('enterprise')}
                    disabled={checkoutMutation.isPending}
                    className="w-full"
                  >
                    Contact for Enterprise Plan
                  </Button>
                </div>
              )}
              
              {planDetails.planType === 'premium' && (
                <Button
                  variant="outline"
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={checkoutMutation.isPending}
                  className="w-full"
                >
                  Contact for Enterprise Plan
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Your subscription is {planDetails.subscriptionStatus}. 
                    Please update your payment method to continue using all features.
                  </p>
                </div>
              </div>
              
              <Button
                onClick={openCustomerPortal}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Update Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Limit Warning */}
      {!planDetails.canAddEmployees && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                You've reached your employee limit. Upgrade your plan to add more employees.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingTab;
