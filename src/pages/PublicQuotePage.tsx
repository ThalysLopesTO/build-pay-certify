import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicQuote, useMarkQuoteViewed, useApproveQuote, useRequestChanges } from '@/hooks/quotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, AlertCircle, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { generateQuotePDF } from '@/utils/quotePDFGenerator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import QuoteStatusBadge from '@/components/admin/quotes/QuoteStatusBadge';
import { ApproveQuoteModal } from '@/components/public/ApproveQuoteModal';
import { RequestChangesModal } from '@/components/public/RequestChangesModal';
import { toast } from 'sonner';

const PublicQuotePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicQuote(token || '');
  const markViewed = useMarkQuoteViewed();
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Mutations
  const approveMutation = useApproveQuote();
  const requestChangesMutation = useRequestChanges();

  // Validate token format
  useEffect(() => {
    if (token) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        console.error('Invalid token format:', token);
      } else {
        console.log('Valid token format:', token);
      }
    }
  }, [token]);

  // Track first view
  useEffect(() => {
    if (data && token) {
      markViewed.mutate(token);
    }
  }, [data, token]);

  const handleDownloadPDF = async () => {
    if (!data) return;

    try {
      // Cast company_settings to partial type for PDF generation
      await generateQuotePDF(
        data.quote,
        data.line_items,
        data.company_settings as any,
        data.company_logo
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleApprove = async (signedName: string) => {
    try {
      await approveMutation.mutateAsync({ token: token!, signedName });
      setSuccessMessage('Thank you! Your quote has been approved. We\'ll contact you shortly to schedule the work.');
      setShowApproveModal(false);
    } catch (error) {
      toast.error('Failed to approve quote. Please try again.');
    }
  };

  const handleRequestChanges = async (message: string) => {
    try {
      await requestChangesMutation.mutateAsync({ token: token!, message });
      setSuccessMessage('Thanks! Your request has been sent. We\'ll review it and follow up with you.');
      setShowRequestChangesModal(false);
    } catch (error) {
      toast.error('Failed to send request. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading quote...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('Public quote error:', { error, token });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Quote Not Found</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  This quote is no longer available or the link may have expired.
                  Please contact the company if you believe this is an error.
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-semibold">Debug Info</summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                      Token: {token}
                      Error: {errorMessage}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { quote, line_items, company_settings, company_logo } = data;
  const subtotal = line_items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = (subtotal * quote.discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * quote.tax) / 100;
  const total = taxableAmount + taxAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Header Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Company Branding */}
              <div className="flex items-start gap-4">
                {company_logo && (
                  <img
                    src={company_logo}
                    alt={company_settings.company_name}
                    className="h-16 w-16 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    {company_settings.company_name}
                  </h1>
                  {company_settings.company_address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {company_settings.company_address}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    {company_settings.company_phone && (
                      <span>{company_settings.company_phone}</span>
                    )}
                    {company_settings.company_email && (
                      <span>{company_settings.company_email}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <Button onClick={handleDownloadPDF} className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quote Details Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-xl">Quote Details</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Quote #{quote.quote_number}
                </p>
              </div>
              <QuoteStatusBadge 
                status={quote.status} 
                publicStatus={quote.public_status} 
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  CLIENT INFORMATION
                </h3>
                <div className="space-y-1">
                  <p className="font-medium">{quote.client_name}</p>
                  {quote.client_company && (
                    <p className="text-sm text-muted-foreground">
                      {quote.client_company}
                    </p>
                  )}
                  <p className="text-sm">{quote.client_email}</p>
                  {quote.client_phone && (
                    <p className="text-sm">{quote.client_phone}</p>
                  )}
                  {quote.client_address && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {quote.client_address}
                    </p>
                  )}
                </div>
              </div>

              {/* Quote Dates */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  QUOTE INFORMATION
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sent On:</span>
                    <span className="text-sm font-medium">
                      {quote.sent_date 
                        ? format(new Date(quote.sent_date), 'MMM dd, yyyy')
                        : format(new Date(quote.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {quote.expiry_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expires:</span>
                      <span className="text-sm font-medium">
                        {format(new Date(quote.expiry_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{quote.project_name}</CardTitle>
          </CardHeader>
          {quote.notes && (
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {quote.notes}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Line Items Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Products & Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">
                      Description
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-sm w-20">
                      Qty
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-sm w-32">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-sm w-32">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {line_items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.description}</div>
                        {item.vendor && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Vendor: {item.vendor}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {quote.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount ({quote.discount}%):
                    </span>
                    <span className="font-medium text-emerald-600">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {quote.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({quote.tax}%):
                    </span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Actions Card */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Quote Actions</CardTitle>
            <CardDescription>
              {quote.public_status === 'approved' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>
                    Approved on {quote.client_approved_at && format(new Date(quote.client_approved_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              {quote.public_status === 'changes_requested' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <MessageCircle className="h-5 w-5" />
                  <span>Change request submitted</span>
                </div>
              )}
              {(!quote.public_status || quote.public_status === 'awaiting_response') && (
                <span>Please review and take action on this quote</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!quote.public_status || quote.public_status === 'awaiting_response') && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowApproveModal(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Approve Quote
                </Button>
                <Button
                  onClick={() => setShowRequestChangesModal(true)}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Request Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Notes */}
        {company_settings.hst_number && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground text-center">
                HST #: {company_settings.hst_number}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <ApproveQuoteModal
        open={showApproveModal}
        onOpenChange={setShowApproveModal}
        onConfirm={handleApprove}
        isLoading={approveMutation.isPending}
        quoteTotal={total}
      />

      <RequestChangesModal
        open={showRequestChangesModal}
        onOpenChange={setShowRequestChangesModal}
        onConfirm={handleRequestChanges}
        isLoading={requestChangesMutation.isPending}
      />
    </div>
  );
};

export default PublicQuotePage;
