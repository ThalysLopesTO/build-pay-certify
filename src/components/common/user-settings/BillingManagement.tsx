import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, FileText, Settings } from 'lucide-react';

interface BillingManagementProps {
  onOpenPortal: () => void;
  isOpeningPortal: boolean;
  isActive: boolean;
}

export const BillingManagement: React.FC<BillingManagementProps> = ({
  onOpenPortal,
  isOpeningPortal,
  isActive,
}) => {
  if (!isActive) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Billing Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Manage your payment methods, view invoices, and update billing information through the Stripe Customer Portal.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onOpenPortal}
              disabled={isOpeningPortal}
              className="flex-1 min-w-[200px]"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isOpeningPortal ? 'Opening...' : 'Manage Billing'}
            </Button>
          </div>

          <div className="bg-muted/50 p-3 rounded-md space-y-2">
            <p className="text-xs font-medium">In the Customer Portal you can:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Update payment methods</li>
              <li>View and download invoices</li>
              <li>Update billing information</li>
              <li>View payment history</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
