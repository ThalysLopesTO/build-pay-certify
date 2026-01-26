import React from 'react';
import { Invoice } from '../types/invoice';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, Calculator, CreditCard, DollarSign, Building2 } from 'lucide-react';
import { PaymentTechnicalDetails } from './PaymentTechnicalDetails';

interface InvoiceDetailsDialogContentProps {
  invoice: Invoice;
  getStatusBadgeClass: (status: string, isOverdue?: boolean) => string;
  isOverdue: (dueDate: string, status: string) => boolean;
}

// Format currency for display
const formatCurrency = (amount: number, currency: string = 'CAD'): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Format cents to currency
const formatCentsAsCurrency = (cents: number | null | undefined, currency: string = 'CAD'): string => {
  if (cents === null || cents === undefined) return '—';
  return formatCurrency(cents / 100, currency);
};

export const InvoiceDetailsDialogContent: React.FC<InvoiceDetailsDialogContentProps> = ({
  invoice,
  getStatusBadgeClass,
  isOverdue,
}) => {
  // Calculate tax amount
  const taxRate = invoice.tax || 0;
  const taxAmount = invoice.subtotal * (taxRate / 100);
  
  // Check if this is a paid invoice with Stripe payment data
  const hasPaidStripePayment = invoice.status === 'paid' && 
    (invoice.net_to_company_cents !== null && invoice.net_to_company_cents !== undefined);

  const currency = invoice.payment_currency || 'CAD';

  return (
    <div className="space-y-6">
      {/* Client Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Client Company</label>
          <p className="text-sm font-medium mt-1">{invoice.client_company}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <p className="text-sm mt-1">{invoice.client_email}</p>
        </div>
      </div>

      <Separator />

      {/* Invoice Breakdown Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Receipt className="h-4 w-4 text-primary" />
          Invoice Breakdown
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          
          {/* Discount (if applicable) */}
          {invoice.discount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive">-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          
          {/* Tax */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
          
          <Separator className="my-2" />
          
          {/* Total Invoice */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Total Invoice</span>
            <span className="font-bold text-lg text-foreground">{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details Section (only for paid invoices with Stripe data) */}
      {hasPaidStripePayment && (
        <>
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Details
              <Badge variant="secondary" className="ml-auto text-xs">Card Payment</Badge>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              {/* Stripe Processing Fee */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Stripe Processing Fee</span>
                </div>
                <span className="text-destructive">
                  {invoice.stripe_processing_fee_cents !== null && invoice.stripe_processing_fee_cents !== undefined
                    ? `-${formatCentsAsCurrency(invoice.stripe_processing_fee_cents, currency)}`
                    : '—'}
                </span>
              </div>
              
              {/* StackBuild Fee */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">StackBuild Fee (1%)</span>
                </div>
                <span className="text-destructive">
                  {invoice.stackbuild_fee_cents !== null && invoice.stackbuild_fee_cents !== undefined
                    ? `-${formatCentsAsCurrency(invoice.stackbuild_fee_cents, currency)}`
                    : '—'}
                </span>
              </div>
              
              <Separator className="my-2" />
              
              {/* Net Amount Received */}
              <div className="flex justify-between items-center bg-primary/10 rounded-md px-3 py-2 -mx-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="font-semibold text-foreground">You Received</span>
                </div>
                <span className="font-bold text-lg text-primary">
                  {formatCentsAsCurrency(invoice.net_to_company_cents, currency)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Technical Details (collapsible) */}
          <PaymentTechnicalDetails invoice={invoice} />
        </>
      )}

      <Separator />

      {/* Status */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">Status</label>
        <Badge className={getStatusBadgeClass(invoice.status, isOverdue(invoice.due_date, invoice.status))}>
          {isOverdue(invoice.due_date, invoice.status) 
            ? 'OVERDUE' 
            : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Badge>
      </div>

      {/* Notes (if present) */}
      {invoice.notes && (
        <>
          <Separator />
          <div>
            <label className="text-sm font-medium text-muted-foreground">Notes</label>
            <p className="text-sm text-foreground mt-1">{invoice.notes}</p>
          </div>
        </>
      )}
    </div>
  );
};
