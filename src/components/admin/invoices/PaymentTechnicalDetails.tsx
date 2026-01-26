import React, { useState } from 'react';
import { Invoice } from '../types/invoice';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentTechnicalDetailsProps {
  invoice: Invoice;
}

// Determine Stripe dashboard URL based on mode
const getStripeDashboardUrl = (paymentIntentId: string): string => {
  const isTestMode = paymentIntentId.includes('_test_') || paymentIntentId.startsWith('pi_test');
  const baseUrl = isTestMode 
    ? 'https://dashboard.stripe.com/test' 
    : 'https://dashboard.stripe.com';
  return `${baseUrl}/payments/${paymentIntentId}`;
};

export const PaymentTechnicalDetails: React.FC<PaymentTechnicalDetailsProps> = ({ invoice }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only render if there's Stripe data to show
  if (!invoice.stripe_payment_intent_id && !invoice.stripe_charge_id && !invoice.paid_at) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between text-muted-foreground hover:text-foreground h-8"
        >
          <span className="text-xs">Technical Details</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="bg-muted/50 rounded-md p-3 space-y-2 text-xs">
          {invoice.stripe_payment_intent_id && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">PaymentIntent ID:</span>
              <code className="text-xs bg-background px-1 py-0.5 rounded truncate max-w-[180px]">
                {invoice.stripe_payment_intent_id}
              </code>
            </div>
          )}
          {invoice.stripe_charge_id && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Charge ID:</span>
              <code className="text-xs bg-background px-1 py-0.5 rounded truncate max-w-[180px]">
                {invoice.stripe_charge_id}
              </code>
            </div>
          )}
          {invoice.stripe_transfer_id && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Transfer ID:</span>
              <code className="text-xs bg-background px-1 py-0.5 rounded truncate max-w-[180px]">
                {invoice.stripe_transfer_id}
              </code>
            </div>
          )}
          {invoice.paid_at && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Paid At:</span>
              <span>{format(new Date(invoice.paid_at), 'PPp')}</span>
            </div>
          )}
          
          {/* View in Stripe Link */}
          {invoice.stripe_payment_intent_id && (
            <div className="pt-2 border-t border-border/50">
              <a 
                href={getStripeDashboardUrl(invoice.stripe_payment_intent_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View in Stripe Dashboard
              </a>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
