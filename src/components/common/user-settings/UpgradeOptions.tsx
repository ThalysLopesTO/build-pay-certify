import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowUp } from 'lucide-react';
import { CompanyPlanData } from '@/hooks/useCompanyPlan';
import { SubscriptionPlan } from '@/config/subscriptionPlans';

interface UpgradeOptionsProps {
  planData: CompanyPlanData;
  onUpgrade: (planId: string) => void;
  isUpgrading: boolean;
}

export const UpgradeOptions: React.FC<UpgradeOptionsProps> = ({ 
  planData, 
  onUpgrade, 
  isUpgrading 
}) => {
  if (planData.availableUpgrades.length === 0) {
    return null;
  }

  const getPriceDifference = (plan: SubscriptionPlan) => {
    if (!planData.currentPlan) {
      return null;
    }
    const diff = plan.price - planData.currentPlan.price;
    return diff > 0 ? `+$${diff.toFixed(2)}` : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowUp className="h-5 w-5" />
          <span>Upgrade Your Plan</span>
        </CardTitle>
        <CardDescription>
          Unlock more features and increase your employee limit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {planData.availableUpgrades.map((plan) => {
            const priceDiff = getPriceDifference(plan);
            
            return (
              <div
                key={plan.id}
                className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
              >
                {/* Plan Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{plan.name}</h4>
                    {plan.popular && (
                      <Badge className="bg-primary text-primary-foreground">
                        {plan.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold">{plan.priceDisplay}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  {priceDiff && (
                    <p className="text-xs text-muted-foreground">
                      {priceDiff}/month more than current plan
                    </p>
                  )}
                </div>

                {/* Key Differences */}
                <div className="space-y-1">
                  <p className="text-sm font-medium">Key upgrades:</p>
                  <ul className="space-y-1">
                    {planData.currentPlan && (
                      <li className="text-sm flex items-start text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        {plan.employeeLimit} employees (from {planData.currentPlan.employeeLimit})
                      </li>
                    )}
                    {plan.features.billsExpenses && !planData.currentPlan?.features.billsExpenses && (
                      <li className="text-sm flex items-start text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        Bills & Expenses Management
                      </li>
                    )}
                    {plan.features.materialRequests && !planData.currentPlan?.features.materialRequests && (
                      <li className="text-sm flex items-start text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        Material Request System
                      </li>
                    )}
                    {plan.features.personalSupport && !planData.currentPlan?.features.personalSupport && (
                      <li className="text-sm flex items-start text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        Personal Support 24hrs
                      </li>
                    )}
                    {plan.features.customSupport && !planData.currentPlan?.features.customSupport && (
                      <li className="text-sm flex items-start text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        Custom Support & Priority
                      </li>
                    )}
                  </ul>
                </div>

                {/* Upgrade Button */}
                <Button
                  className="w-full"
                  onClick={() => onUpgrade(plan.id)}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Processing...' : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
