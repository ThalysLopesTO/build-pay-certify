import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { CompanyPlanData } from '@/hooks/useCompanyPlan';

interface CurrentPlanCardProps {
  planData: CompanyPlanData;
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ planData }) => {
  const getStatusBadge = () => {
    if (planData.isInTrial) {
      return <Badge className="bg-blue-100 text-blue-800">Trial - {planData.daysUntilExpiry} days left</Badge>;
    }
    if (planData.isInGracePeriod) {
      return <Badge className="bg-orange-100 text-orange-800">Past Due - {planData.daysUntilExpiry} days grace period</Badge>;
    }
    if (planData.subscriptionStatus === 'active') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (planData.subscriptionStatus === 'canceled') {
      return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const getExpiryDate = () => {
    if (planData.isInTrial && planData.trialEndDate) {
      return { label: 'Trial ends', date: planData.trialEndDate };
    }
    if (planData.isInGracePeriod && planData.gracePeriodEndDate) {
      return { label: 'Grace period ends', date: planData.gracePeriodEndDate };
    }
    if (planData.subscriptionEndDate) {
      return { label: 'Renews', date: planData.subscriptionEndDate };
    }
    return null;
  };

  const expiryInfo = getExpiryDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span>Current Plan</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Plan Name and Price */}
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h3 className="text-2xl font-bold">
              {planData.currentPlan?.displayName || 'No Active Plan'}
            </h3>
            {planData.currentPlan && (
              <span className="text-xl font-semibold text-primary">
                {planData.currentPlan.priceDisplay}/month
              </span>
            )}
          </div>

          {/* Expiry/Renewal Date */}
          {expiryInfo && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {expiryInfo.label}: {format(new Date(expiryInfo.date), 'MMM dd, yyyy')}
            </div>
          )}

          {/* Employee Usage */}
          {planData.currentPlan && (
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Employee Usage</span>
                <span className="text-muted-foreground">
                  {planData.currentEmployeeCount}/{planData.employeeLimit} employees
                </span>
              </div>
              <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (planData.currentEmployeeCount / planData.employeeLimit) * 100)}%`,
                  }}
                />
              </div>
              {planData.remainingSlots === 0 && (
                <p className="text-xs text-orange-600 mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Employee limit reached. Upgrade to add more.
                </p>
              )}
            </div>
          )}

          {/* Features List */}
          {planData.currentPlan && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Plan Features</h4>
              <ul className="space-y-1">
                {planData.currentPlan.featureList.map((feature, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trial Warning */}
          {planData.isInTrial && planData.daysUntilExpiry && planData.daysUntilExpiry <= 3 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-sm text-orange-800 flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                Your trial ends in {planData.daysUntilExpiry} day{planData.daysUntilExpiry !== 1 ? 's' : ''}. Subscribe to continue using StackBuild.
              </p>
            </div>
          )}

          {/* Grace Period Warning */}
          {planData.isInGracePeriod && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                Payment failed. Update your payment method within {planData.daysUntilExpiry} day{planData.daysUntilExpiry !== 1 ? 's' : ''} to avoid losing access.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
