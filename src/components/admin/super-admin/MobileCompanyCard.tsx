import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Edit, Trash2, Key, ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

interface Company {
  id: string;
  name: string;
  status: string;
  registration_date: string | null;
  expiration_date: string | null;
  created_at: string;
  is_expired: boolean;
  days_until_expiry: number | null;
  admin_email?: string;
  admin_phone?: string;
  admin_user_id?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  plan: string;
  subscription_status: string;
  trial_end_date: string | null;
  grace_period_end_date: string | null;
  created_by_super_admin: boolean;
  trial_days_remaining: number | null;
  subscription_days_remaining: number | null;
}

interface MobileCompanyCardProps {
  company: Company;
  onEdit: (company: Company) => void;
  onRevoke: (company: Company) => void;
  onResetPassword: (company: Company) => void;
  isProcessing: boolean;
}

export const MobileCompanyCard: React.FC<MobileCompanyCardProps> = ({
  company,
  onEdit,
  onRevoke,
  onResetPassword,
  isProcessing,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${
      company.is_expired ? 'border-red-300 bg-red-50/50' : ''
    }`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-foreground truncate">
                {company.name}
              </h3>
            </div>
            <div className="space-y-2">
              <SubscriptionStatusBadge
                subscriptionStatus={company.subscription_status}
                plan={company.plan}
                trialDaysRemaining={company.trial_days_remaining}
                subscriptionDaysRemaining={company.subscription_days_remaining}
                isExpired={company.is_expired}
                isSuperAdminCompany={company.created_by_super_admin}
              />
              <div className="text-xs text-muted-foreground">
                Plan: <span className="font-medium capitalize">
                  {company.plan === 'start' ? 'Start' : 
                   company.plan === 'builder' ? 'Builder' : 
                   company.plan === 'builder_pro' ? 'Builder Pro' : 
                   company.plan === 'free' ? 'Free' : company.plan}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="ml-2 flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Date Information */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm">
            <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground mr-2">Registered:</span>
            <span className="font-medium">
              {company.registration_date
                ? format(new Date(company.registration_date), 'MMM dd, yyyy')
                : '--'}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground mr-2">
              {company.trial_end_date && company.subscription_status === 'trialing' 
                ? 'Trial Ends:' 
                : 'Next Billing / Expiry:'}
            </span>
            <span className={`font-medium ${
              company.is_expired ? 'text-red-600' : 
              company.trial_days_remaining !== null && company.trial_days_remaining <= 2 ? 'text-orange-600' : ''
            }`}>
              {company.trial_end_date && company.subscription_status === 'trialing'
                ? format(new Date(company.trial_end_date), 'MMM dd, yyyy')
                : company.expiration_date
                ? format(new Date(company.expiration_date), 'MMM dd, yyyy')
                : '--'}
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="pt-3 border-t space-y-2 animate-fade-in">
            {company.admin_email && (
              <div className="flex items-center text-sm">
                <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground break-all">
                  {company.admin_email}
                </span>
              </div>
            )}
            {company.admin_phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {company.admin_phone}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {company.status === 'active' && (
          <div className="space-y-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full touch-target"
              onClick={() => onResetPassword(company)}
              disabled={isProcessing || !company.admin_user_id}
            >
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Reset Admin Password
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 touch-target"
                onClick={() => onEdit(company)}
                disabled={isProcessing}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 touch-target"
                onClick={() => onRevoke(company)}
                disabled={isProcessing}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Revoke
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
