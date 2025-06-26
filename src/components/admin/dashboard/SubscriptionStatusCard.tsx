
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, isAfter, subDays } from 'date-fns';

const SubscriptionStatusCard = () => {
  const { subscriptionStatus, isLoading, syncSubscription, isSyncing } = useSubscriptionSync();

  if (isLoading) {
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

  const isActive = subscriptionStatus?.status === 'active';
  const subscriptionEnd = subscriptionStatus?.current_period_end;
  
  // Check if subscription is expiring soon (within 7 days)
  const isExpiringSoon = subscriptionEnd && 
    isAfter(new Date(subscriptionEnd), new Date()) && 
    !isAfter(new Date(subscriptionEnd), subDays(new Date(), -7));

  const handleManageSubscription = () => {
    window.location.href = '/pricing';
  };

  const handleRefreshStatus = () => {
    syncSubscription();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={isSyncing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {subscriptionStatus?.plan_type?.charAt(0).toUpperCase() + subscriptionStatus?.plan_type?.slice(1) || 'No Plan'} 
              {isActive ? ' (Active)' : ' (Inactive)'}
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
              {isActive ? 'Renews' : 'Expired'}: {format(new Date(subscriptionEnd), 'MMM dd, yyyy')}
            </p>
          )}

          {subscriptionStatus?.employee_limit && (
            <p className="text-xs text-muted-foreground">
              Employee Limit: {subscriptionStatus.employee_limit === null ? 'Unlimited' : subscriptionStatus.employee_limit}
            </p>
          )}
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              className={`text-xs ${!isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={handleManageSubscription}
            >
              {!isActive ? 'Subscribe Now' : 'Manage Plan'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;
