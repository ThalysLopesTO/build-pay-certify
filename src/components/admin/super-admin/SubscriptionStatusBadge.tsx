import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface SubscriptionStatusBadgeProps {
  subscriptionStatus: string;
  plan: string;
  trialDaysRemaining: number | null;
  subscriptionDaysRemaining: number | null;
  isExpired: boolean;
  isSuperAdminCompany: boolean;
}

export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  subscriptionStatus,
  plan,
  trialDaysRemaining,
  subscriptionDaysRemaining,
  isExpired,
  isSuperAdminCompany,
}) => {
  // Free account created by super admin
  if (isSuperAdminCompany && plan === 'free') {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Crown className="h-3 w-3" />
        Free Account
      </Badge>
    );
  }

  // Trialing
  if (subscriptionStatus === 'trialing' && trialDaysRemaining !== null) {
    const variant = trialDaysRemaining <= 2 ? 'destructive' : 'default';
    return (
      <Badge variant={variant} className="gap-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
        <Clock className="h-3 w-3" />
        Trial ({trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} left)
      </Badge>
    );
  }

  // Active subscription
  if (subscriptionStatus === 'active') {
    const planName = plan === 'start' ? 'Start' : plan === 'builder' ? 'Builder' : plan === 'builder_pro' ? 'Builder Pro' : 'Active';
    
    // Warning if expiring soon
    if (subscriptionDaysRemaining !== null && subscriptionDaysRemaining <= 30 && subscriptionDaysRemaining > 0) {
      return (
        <Badge variant="outline" className="gap-1.5 bg-orange-50 text-orange-700 border-orange-200">
          <AlertCircle className="h-3 w-3" />
          {planName} (expires in {subscriptionDaysRemaining}d)
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="gap-1.5 bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3" />
        Active - {planName}
      </Badge>
    );
  }

  // Payment failed / past due with grace period
  if (subscriptionStatus === 'past_due' && subscriptionDaysRemaining !== null && subscriptionDaysRemaining > 0) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-yellow-50 text-yellow-700 border-yellow-200">
        <AlertCircle className="h-3 w-3" />
        Payment Failed ({subscriptionDaysRemaining}d grace)
      </Badge>
    );
  }

  // Expired
  if (isExpired || subscriptionStatus === 'canceled' || subscriptionStatus === 'unpaid') {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  // Inactive
  if (subscriptionStatus === 'inactive') {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <AlertCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  }

  // Default fallback
  return (
    <Badge variant="outline" className="gap-1.5">
      {subscriptionStatus || 'Unknown'}
    </Badge>
  );
};
