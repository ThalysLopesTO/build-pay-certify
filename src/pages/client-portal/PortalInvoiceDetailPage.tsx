import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, MapPin, Download, Lock, Loader2, CreditCard, CheckCircle, AlertTriangle, XCircle, Paperclip } from 'lucide-react';
import { isImageAttachment, formatFileSize } from '@/hooks/useInvoiceAttachments';
import { format } from 'date-fns';
import { generatePortalInvoicePDF } from '@/utils/portalInvoicePDFGenerator';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

export default function PortalInvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { invoices, token, company_settings, refetch } = useClientPortalContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed' | null>(null);
  const [pollingAttempt, setPollingAttempt] = useState(0);
  const [canCancel, setCanCancel] = useState(false);
  const [stripeLoadError, setStripeLoadError] = useState(false);
  const isMobile = useIsMobile();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollingAttempts = 15; // 30 seconds total (15 * 2s)

  const invoice = invoices.find(i => i.id === invoiceId);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Verify payment status via edge function
  const verifyPaymentStatus = useCallback(async (): Promise<'succeeded' | 'failed' | 'processing' | 'expired'> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-invoice-payment', {
        body: { invoice_id: invoiceId, portal_token: token }
      });

      if (error) {
        console.error('Error verifying payment:', error);
        return 'processing';
      }

      return data?.status || 'processing';
    } catch (err) {
      console.error('Exception verifying payment:', err);
      return 'processing';
    }
  }, [invoiceId, token]);

  // Handle return from Stripe checkout
  useEffect(() => {
    const payment = searchParams.get('payment');
    
    if (payment === 'success') {
      setPaymentStatus('processing');
      setPollingAttempt(0);
      setCanCancel(false);
      // Clear the URL parameter immediately
      setSearchParams({}, { replace: true });

      // Start polling for payment verification
      const startPolling = async () => {
        let attempts = 0;
        
        pollingRef.current = setInterval(async () => {
          attempts++;
          setPollingAttempt(attempts);

          const status = await verifyPaymentStatus();

          if (status === 'succeeded') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPaymentStatus('success');
            await refetch();
            toast({
              title: "Payment Successful",
              description: "Thank you! Your payment has been processed successfully.",
            });
          } else if (status === 'failed' || status === 'expired') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPaymentStatus('failed');
            toast({
              title: "Payment Failed",
              description: "There was an issue with your payment. Please try again.",
              variant: "destructive",
            });
          } else if (attempts >= maxPollingAttempts) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setCanCancel(true);
            toast({
              title: "Payment Verification Delayed",
              description: "We're still confirming your payment. You can wait or try refreshing the page.",
            });
          }
        }, 2000);
      };

      startPolling();
    } else if (payment === 'cancelled') {
      setSearchParams({}, { replace: true });
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the payment. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, setSearchParams, refetch, verifyPaymentStatus]);

  // Check if invoice status changed to paid (backup check)
  useEffect(() => {
    if (paymentStatus === 'processing' && invoice?.status === 'paid') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setPaymentStatus('success');
      toast({
        title: "Payment Successful",
        description: "Thank you! Your payment has been processed successfully.",
      });
    }
  }, [invoice?.status, paymentStatus]);

  // Check for Stripe script load errors
  useEffect(() => {
    const checkStripeLoad = () => {
      // If we're on the page and window.Stripe doesn't exist after a reasonable time
      const timeout = setTimeout(() => {
        if (typeof window !== 'undefined' && !(window as any).Stripe) {
          // Check if there are CSP violations in console
          console.warn('Stripe.js may not have loaded - checking for CSP issues');
        }
      }, 5000);

      return () => clearTimeout(timeout);
    };

    checkStripeLoad();
  }, []);

  const handleCancelPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setPaymentStatus(null);
    setPollingAttempt(0);
    setCanCancel(false);
    toast({
      title: "Verification Cancelled",
      description: "You can check your invoice status later or try paying again.",
    });
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    try {
      await generatePortalInvoicePDF(invoice, company_settings);
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    
    setIsProcessingPayment(true);
    setStripeLoadError(false);
    
    try {
      const successUrl = `${window.location.origin}/client/${token}/invoices/${invoiceId}?payment=success`;
      const cancelUrl = `${window.location.origin}/client/${token}/invoices/${invoiceId}?payment=cancelled`;

      const { data, error } = await supabase.functions.invoke('stripe-create-invoice-checkout', {
        body: {
          invoice_id: invoice.id,
          portal_token: token,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it might be a CSP/script blocking issue
      if (errorMessage.includes('blocked') || errorMessage.includes('CSP') || errorMessage.includes('script')) {
        setStripeLoadError(true);
      }
      
      // Check for live payments not enabled error
      if (errorMessage.includes('Live invoice payments are not enabled')) {
        toast({
          title: "Payments Unavailable",
          description: "Live payments have not been enabled for this company yet. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Error",
          description: errorMessage || "Unable to start payment. Please try again.",
          variant: "destructive",
        });
      }
      setIsProcessingPayment(false);
    }
  };

  if (!invoice) {
    return (
      <div className="text-center py-12 pt-16 lg:pt-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button onClick={() => navigate(`/client/${token}/invoices`)} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending';
  
  // Check if payment is available
  const canPay = 
    invoice.status === 'pending' && 
    company_settings.payments_enabled === true && 
    company_settings.stripe_connect_charges_enabled === true;

  const InvoiceSummaryCard = () => (
    <Card className={isMobile ? '' : 'sticky top-6'}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stripe Load Error Alert */}
        {stripeLoadError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Payment screen blocked by browser security settings. Try using Incognito mode or disable browser extensions.
            </AlertDescription>
          </Alert>
        )}

        {/* Status */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="flex gap-2">
            {paymentStatus === 'processing' ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing
              </Badge>
            ) : paymentStatus === 'success' || invoice.status === 'paid' ? (
              <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                <CheckCircle className="w-3 h-3" />
                Paid
              </Badge>
            ) : paymentStatus === 'failed' ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Failed
              </Badge>
            ) : (
              <Badge variant="secondary">{invoice.status}</Badge>
            )}
            {isOverdue && invoice.status !== 'paid' && paymentStatus !== 'success' && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
        </div>

        {/* Amount Due */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {invoice.status === 'paid' || paymentStatus === 'success' ? 'Amount Paid' : 'Amount Due'}
          </p>
          <p className="text-3xl font-bold text-primary">
            ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Due Date */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Due Date</p>
          <p className={`font-medium ${isOverdue && invoice.status !== 'paid' && paymentStatus !== 'success' ? 'text-destructive' : ''}`}>
            {format(new Date(invoice.due_date), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Pay Invoice Button / Status */}
        <div className="pt-2 space-y-2">
          {paymentStatus === 'processing' ? (
            <div className="space-y-3">
              <Button className="w-full" size="lg" disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming Payment...
              </Button>
              
              {/* Progress indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Verifying with payment processor</span>
                  <span>{pollingAttempt}/{maxPollingAttempts}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(pollingAttempt / maxPollingAttempts) * 100}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Please do not refresh or close this page.
              </p>

              {canCancel && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelPolling}
                  className="w-full"
                >
                  Cancel and check later
                </Button>
              )}
            </div>
          ) : paymentStatus === 'success' || invoice.status === 'paid' ? (
            <>
              <div className="w-full py-3 px-4 bg-green-500/10 rounded-md flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-600">Paid in Full</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Thank you for your payment!
              </p>
            </>
          ) : paymentStatus === 'failed' ? (
            <>
              <div className="w-full py-3 px-4 bg-destructive/10 rounded-md flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="font-medium text-destructive">Payment Failed</span>
              </div>
              {canPay && (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={() => {
                    setPaymentStatus(null);
                    handlePayInvoice();
                  }}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
              )}
            </>
          ) : canPay ? (
            <>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handlePayInvoice}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Invoice
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center opacity-70">
                Secure payments powered by Stripe.
              </p>
            </>
          ) : (
            <>
              <Button className="w-full" size="lg" disabled>
                <Lock className="w-4 h-4 mr-2" />
                Pay Invoice
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Payments are not enabled by this company.
              </p>
              <p className="text-xs text-muted-foreground text-center opacity-70">
                Secure payments powered by Stripe.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/client/${token}/invoices`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Invoices
      </Button>

      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mobile-only: Summary Card at top */}
          {isMobile && <InvoiceSummaryCard />}

          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl md:text-3xl mb-2">{invoice.invoice_number}</CardTitle>
                  <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                    {invoice.title}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoice.sent_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sent:</span>
                    <span className="font-medium">
                      {format(new Date(invoice.sent_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Due:</span>
                  <span className={`font-medium ${isOverdue && invoice.status !== 'paid' ? 'text-destructive' : ''}`}>
                    {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {invoice.client_address && (
                  <div className="flex items-start gap-2 text-sm md:col-span-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium">{invoice.client_address}</span>
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              {invoice.line_items && invoice.line_items.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Item Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-3 font-semibold">Description</th>
                          <th className="text-right p-3 font-semibold">Unit Price</th>
                          <th className="text-right p-3 font-semibold">Qty</th>
                          <th className="text-right p-3 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.line_items.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="p-3">{item.description}</td>
                            <td className="text-right p-3">${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="text-right p-3">{item.quantity}</td>
                            <td className="text-right p-3 font-medium">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="pt-4 border-t space-y-3">
                {invoice.subtotal > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {invoice.discount && invoice.discount > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">
                      -${invoice.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Tax ({invoice.tax_rate.toFixed(2)}%)</span>
                    <span className="font-medium">+${invoice.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-base md:text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl md:text-3xl font-bold text-primary">
                    ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}

              {/* Attachments */}
              {invoice.attachments && invoice.attachments.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">
                    Attachments ({invoice.attachments.length})
                  </h3>

                  {/* Photo attachments as thumbnails */}
                  {invoice.attachments.some(isImageAttachment) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      {invoice.attachments.filter(isImageAttachment).map((att) => (
                        <a
                          key={att.id}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            loading="lazy"
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="px-2 py-1.5 text-xs text-muted-foreground truncate bg-muted/30">
                            {att.file_name}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Other files as download rows */}
                  {invoice.attachments.filter((att) => !isImageAttachment(att)).map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 mb-2 text-sm hover:bg-muted/40 transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{att.file_name}</span>
                        {att.file_size ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatFileSize(att.file_size)}
                          </span>
                        ) : null}
                      </span>
                      <Download className="w-4 h-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sticky Sidebar (Desktop only) */}
        {!isMobile && (
          <div className="lg:col-span-1">
            <InvoiceSummaryCard />
          </div>
        )}
      </div>
    </div>
  );
}
