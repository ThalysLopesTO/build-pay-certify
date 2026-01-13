import React, { useState } from 'react';
import { Invoice } from '../types/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CreditCard, ChevronDown, ChevronUp, ExternalLink, Info, DollarSign, Receipt, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentBreakdownSectionProps {
  invoice: Invoice;
}

// Format cents to currency string
const formatCurrency = (cents: number | null | undefined, currency: string = 'CAD'): string => {
  if (cents === null || cents === undefined) return '—';
  const amount = cents / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Determine Stripe dashboard URL based on mode
const getStripeDashboardUrl = (paymentIntentId: string): string => {
  // Check if it's a test mode ID (starts with pi_test_ or contains _test_)
  const isTestMode = paymentIntentId.includes('_test_') || paymentIntentId.startsWith('pi_test');
  const baseUrl = isTestMode 
    ? 'https://dashboard.stripe.com/test' 
    : 'https://dashboard.stripe.com';
  return `${baseUrl}/payments/${paymentIntentId}`;
};

export const PaymentBreakdownSection: React.FC<PaymentBreakdownSectionProps> = ({ invoice }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Only show this section for paid invoices with Stripe payment data
  const hasStripePayment = invoice.status === 'paid' && 
    (invoice.stripe_payment_intent_id || invoice.payment_method_type === 'card');

  if (!hasStripePayment) {
    return null;
  }

  const currency = invoice.payment_currency || 'cad';
  const grossAmountCents = Math.round(invoice.total_amount * 100);
  const stripeFeeCents = invoice.stripe_processing_fee_cents;
  const stackbuildFeeCents = invoice.stackbuild_fee_cents;
  const netAmountCents = invoice.net_to_company_cents;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-primary" />
          Payment Breakdown
          <Badge variant="secondary" className="ml-auto text-xs">
            Card Payment
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee Breakdown Table */}
        <div className="space-y-2">
          {/* Invoice Amount (Gross) */}
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span>Invoice Amount</span>
            </div>
            <span className="font-medium">{formatCurrency(grossAmountCents, currency)}</span>
          </div>

          {/* Stripe Processing Fee */}
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Stripe Processing Fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Standard Stripe processing fee (typically 2.9% + $0.30 per transaction)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-destructive">
              {stripeFeeCents !== null && stripeFeeCents !== undefined 
                ? `-${formatCurrency(stripeFeeCents, currency)}` 
                : '—'}
            </span>
          </div>

          {/* StackBuild Platform Fee */}
          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>StackBuild Fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      1% platform fee for payment processing services
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-destructive">
              {stackbuildFeeCents !== null && stackbuildFeeCents !== undefined 
                ? `-${formatCurrency(stackbuildFeeCents, currency)}` 
                : '—'}
            </span>
          </div>

          {/* Net Amount (highlighted) */}
          <div className="flex justify-between items-center py-2.5 bg-primary/10 rounded-md px-3 -mx-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>💰 Net Deposit (You Receive)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Net deposit is an estimate based on Stripe transaction fees. 
                      Final payout timing depends on your Stripe payout schedule.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-bold text-primary text-lg">
              {formatCurrency(netAmountCents, currency)}
            </span>
          </div>
        </div>

        {/* Technical Details (Collapsible) */}
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
              <span className="text-xs">Technical Details</span>
              {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
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
      </CardContent>
    </Card>
  );
};
