
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useCancellationRequests } from '@/hooks/useCancellationRequests';
import { CreditCard, AlertCircle, Settings, RefreshCw, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Single pricing plan configuration
const STACKBUILD_PLAN = {
  name: 'StackBuild',
  price: '$197 CAD',
  features: [
    'Unlimited employees',
    'Payroll & Invoice System',
    'Certificate & Safety Tracking',
    'Multi-role Access: Admin, Foreman, Worker',
    'Project & Jobsite Control'
  ]
};

const PlanTab = () => {
  const { user, isCompanyAdmin } = useAuth();
  const { requests, submitCancellationRequest } = useCancellationRequests();
  const {
    subscriptionStatus,
    isLoadingStatus,
    isCheckingSubscription,
    createCheckout,
    isCreatingCheckout,
    openCustomerPortal,
    isOpeningPortal,
    checkSubscription,
  } = useStripeSubscription();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Find pending request for current user's company
  const pendingRequest = requests.find(request => request.status === 'pending');

  const handleCancellationSubmit = async () => {
    await submitCancellationRequest.mutateAsync({ notes });
    setIsDialogOpen(false);
    setNotes('');
  };

  const handleRenewSubscription = () => {
    createCheckout({ planType: 'premium' });
  };

  // Only show subscription management for admins
  if (!isCompanyAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only company administrators can manage subscription plans.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Checking subscription status...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSubscribed = subscriptionStatus?.subscribed || false;

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Current Plan</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkSubscription()}
              disabled={isCheckingSubscription}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingSubscription ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge className={isSubscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {isSubscribed ? 'StackBuild Plan - Active' : 'Subscription Required'}
                </Badge>
                <span className="text-lg font-semibold text-orange-600">
                  {STACKBUILD_PLAN.price}/month
                </span>
              </div>
              {subscriptionStatus?.subscription_end && (
                <span className="text-sm text-muted-foreground">
                  {isSubscribed ? 'Renews' : 'Expired'}: {format(new Date(subscriptionStatus.subscription_end), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Plan Features:</h4>
              <ul className="space-y-1">
                {STACKBUILD_PLAN.features.map((feature, index) => (
                  <li key={index} className="text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-2 pt-4">
              {isSubscribed ? (
                <Button
                  variant="outline"
                  onClick={() => openCustomerPortal()}
                  disabled={isOpeningPortal}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              ) : (
                <Button
                  onClick={handleRenewSubscription}
                  disabled={isCreatingCheckout}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isCreatingCheckout ? 'Processing...' : 'Renew Now'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details */}
      {!isSubscribed && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700">Subscription Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Your subscription has expired. Please renew to continue using StackBuild.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Cancellation Section - Only show if subscribed */}
      {isSubscribed && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Plan Cancellation</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequest ? (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cancellation request pending review</span>
                    <span className="text-xs text-orange-600">
                      Submitted {new Date(pendingRequest.request_date).toLocaleDateString()}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Need to cancel your subscription? Submit a cancellation request for review.
                </p>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Cancel My Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Your Plan</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel your plan? Your access will end at the end of your billing cycle.
                        This action requires approval from our team.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Reason for cancellation (optional)
                        </label>
                        <Textarea
                          placeholder="Please let us know why you're cancelling..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={submitCancellationRequest.isPending}
                      >
                        Keep Plan
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancellationSubmit}
                        disabled={submitCancellationRequest.isPending}
                      >
                        {submitCancellationRequest.isPending ? 'Submitting...' : 'Submit Cancellation Request'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlanTab;
