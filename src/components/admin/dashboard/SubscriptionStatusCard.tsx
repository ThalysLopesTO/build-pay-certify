
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { format, isAfter, subDays } from 'date-fns';

const SubscriptionStatusCard = () => {
  const { subscriptionStatus, isLoadingStatus, createCheckout, openCustomerPortal } = useStripeSubscription();

  if (isLoadingStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSubscribed = subscriptionStatus?.subscribed || false;
  const subscriptionEnd = subscriptionStatus?.subscription_end;
  
  // Check if subscription is expiring soon (within 7 days)
  const isExpiringSoon = subscriptionEnd && 
    isAfter(new Date(subscriptionEnd), new Date()) && 
    !isAfter(new Date(subscriptionEnd), subDays(new Date(), -7));

  const handleSubscribe = () => {
    createCheckout({ priceId: 'price_1RbVmQEuB2J4BS43bsSzcSQM', planName: 'StackBuild' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={isSubscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isSubscribed ? 'StackBuild Plan' : 'No Subscription'}
            </Badge>
            {isExpiringSoon && (
              <div className="flex items-center text-amber-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-xs">Expiring Soon</span>
              </div>
            )}
          </div>
          
          {subscriptionEnd && (
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? 'Renews' : 'Expired'}: {format(new Date(subscriptionEnd), 'MMM dd, yyyy')}
            </p>
          )}
          
          <div className="flex space-x-2">
            {!isSubscribed ? (
              <Button 
                size="sm" 
                className="text-xs bg-orange-600 hover:bg-orange-700"
                onClick={handleSubscribe}
              >
                Subscribe Now
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => openCustomerPortal()}
              >
                Manage
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;
