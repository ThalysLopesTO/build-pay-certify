import { useParams, useNavigate } from 'react-router-dom';
import { useClientPortalContext } from '@/contexts/ClientPortalContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, DollarSign, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { formatInCompanyTimezone, getReportDisplayDate, DEFAULT_TIMEZONE } from '@/utils/timezone';
import { ApproveQuoteDialog, DeclineQuoteDialog, RequestChangesDialog } from '@/components/client-portal/QuoteActionDialogs';
import { useState } from 'react';
import { useApproveQuote, useRequestChanges, useDeclineQuote } from '@/hooks/quotes/useQuoteActions';
import { useToast } from '@/hooks/use-toast';

export default function PortalQuoteDetailPage() {
  const { quoteId } = useParams();
  const { quotes, token, company_settings } = useClientPortalContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [approveOpen, setApproveOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);

  const approveQuote = useApproveQuote();
  const requestChanges = useRequestChanges();
  const declineQuote = useDeclineQuote();

  const quote = quotes.find(q => q.id === quoteId);

  if (!quote) {
    return (
      <div className="text-center py-12 pt-16 lg:pt-12">
        <p className="text-muted-foreground">Quote not found</p>
        <Button onClick={() => navigate(`/client/${token}/quotes`)} className="mt-4">
          Back to Quotes
        </Button>
      </div>
    );
  }

  const canTakeAction = (quote.status === 'sent' || quote.public_status === 'sent' || quote.public_status === 'awaiting_response') &&
    !quote.client_approved_at && 
    !quote.client_declined_at &&
    quote.public_status !== 'changes_requested';

  const getStatusColor = (status: string, publicStatus?: string | null) => {
    if (publicStatus === 'approved' || status === 'accepted') return 'bg-green-600';
    if (publicStatus === 'declined' || status === 'declined') return 'bg-red-600';
    if (publicStatus === 'changes_requested') return 'bg-blue-600';
    if (publicStatus === 'awaiting_response' || status === 'sent') return 'bg-orange-600';
    return 'bg-gray-600';
  };

  const handleApprove = async (signedName: string) => {
    if (!quote.public_token) return;
    
    try {
      await approveQuote.mutateAsync({ token: quote.public_token, signedName });
      toast({
        title: 'Quote Approved',
        description: 'Thank you! Your approval has been sent successfully.',
      });
      setApproveOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDecline = async (reason: string) => {
    if (!quote.public_token) return;
    
    try {
      await declineQuote.mutateAsync({ token: quote.public_token, reason });
      toast({
        title: 'Quote Declined',
        description: 'Your response has been sent. We\'ll be in touch soon.',
      });
      setDeclineOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRequestChanges = async (message: string) => {
    if (!quote.public_token) return;
    
    try {
      await requestChanges.mutateAsync({ token: quote.public_token, message });
      toast({
        title: 'Changes Requested',
        description: 'Your request has been sent successfully. The company will review your request and send you an updated quote.',
      });
      setChangesOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/client/${token}/quotes`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Quotes
      </Button>

      {/* Quote Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl mb-2">{quote.quote_number}</CardTitle>
              <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                {quote.project_name}
              </p>
            </div>
            <Badge className={`self-start md:self-center ${getStatusColor(quote.status, quote.public_status)} text-white border-0`}>
              {quote.public_status || quote.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quote Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quote.quote_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {getReportDisplayDate(quote.quote_date, company_settings.timezone || DEFAULT_TIMEZONE)}
                </span>
              </div>
            )}
            
            {quote.expiry_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium">
                  {getReportDisplayDate(quote.expiry_date, company_settings.timezone || DEFAULT_TIMEZONE)}
                </span>
              </div>
            )}
            
            {quote.client_address && (
              <div className="flex items-start gap-2 text-sm md:col-span-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{quote.client_address}</span>
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-base md:text-lg font-medium">Total Amount</span>
              </div>
              <span className="text-2xl md:text-3xl font-bold text-primary">
                ${quote.total_amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {quote.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Request History - Always show if client_change_request exists */}
      {quote.client_change_request && (
        <Card className={`border-l-4 ${
          quote.public_status === 'changes_requested' 
            ? 'border-l-blue-600' 
            : 'border-l-muted'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              quote.public_status === 'changes_requested'
                ? 'text-blue-700'
                : 'text-muted-foreground'
            }`}>
              <MessageCircle className="h-5 w-5" />
              {quote.public_status === 'changes_requested' 
                ? 'Changes Requested' 
                : 'Change Request History'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Message:</p>
              <div className={`p-4 rounded-md ${
                quote.public_status === 'changes_requested'
                  ? 'bg-blue-50 dark:bg-blue-950/20'
                  : 'bg-muted/30'
              }`}>
                <p className="text-sm italic">"{quote.client_change_request}"</p>
              </div>
            </div>
            
            {quote.client_change_requested_at && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Requested on:</span>{' '}
                {formatInCompanyTimezone(quote.client_change_requested_at, 'MMM d, yyyy \'at\' h:mm a', company_settings.timezone || DEFAULT_TIMEZONE)}
              </div>
            )}

            <div className={`p-4 rounded-md ${
              quote.public_status === 'changes_requested'
                ? 'bg-muted/50'
                : 'bg-muted/30'
            }`}>
              <p className="text-sm">
                {quote.public_status === 'changes_requested' && (
                  <>
                    <span className="font-semibold text-blue-700">Status: Pending Review</span>
                    <br />
                    The company has received your change request and will review it shortly. 
                    You'll receive an email notification when they respond with an updated quote.
                  </>
                )}
                {quote.public_status === 'awaiting_response' && !quote.client_approved_at && !quote.client_declined_at && (
                  <>
                    <span className="font-semibold text-green-700">Status: Updated Quote Sent</span>
                    <br />
                    The company has reviewed your request and sent an updated quote above. 
                    Please review the changes and take action.
                  </>
                )}
                {(quote.public_status === 'approved' || quote.client_approved_at) && (
                  <>
                    <span className="font-semibold">Historical Record</span>
                    <br />
                    This change request was addressed before the quote was approved.
                  </>
                )}
                {(quote.public_status === 'declined' || quote.client_declined_at) && (
                  <>
                    <span className="font-semibold">Historical Record</span>
                    <br />
                    Original change request from before the quote was declined.
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Signature Section - Show if approved or declined */}
      {(quote.client_approved_at || quote.client_declined_at) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {quote.client_approved_at ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Quote Approved
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Quote Declined
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quote.client_name_signed && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Client Signature:</p>
                <p className="font-semibold text-lg italic border-b-2 border-border inline-block pb-1">
                  {quote.client_name_signed}
                </p>
              </div>
            )}
            {quote.client_approved_at && (
              <div>
                <p className="text-sm text-muted-foreground">Approved on:</p>
                <p className="font-medium">
                  {formatInCompanyTimezone(quote.client_approved_at, 'MMMM d, yyyy \'at\' h:mm a', company_settings.timezone || DEFAULT_TIMEZONE)}
                </p>
              </div>
            )}
            {quote.client_declined_at && (
              <div>
                <p className="text-sm text-muted-foreground">Declined on:</p>
                <p className="font-medium">
                  {formatInCompanyTimezone(quote.client_declined_at, 'MMMM d, yyyy \'at\' h:mm a', company_settings.timezone || DEFAULT_TIMEZONE)}
                </p>
              </div>
            )}
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-xs text-muted-foreground">
                This electronic signature has the same legal effect as a handwritten signature 
                and constitutes acceptance of the terms outlined in this quote.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canTakeAction && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setApproveOpen(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Approve Quote
              </Button>
              <Button 
                onClick={() => setChangesOpen(true)}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Request Changes
              </Button>
              <Button 
                onClick={() => setDeclineOpen(true)}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {quote.public_token && (
        <>
          <ApproveQuoteDialog
            open={approveOpen}
            onOpenChange={setApproveOpen}
            onConfirm={handleApprove}
            isLoading={approveQuote.isPending}
          />
          <DeclineQuoteDialog
            open={declineOpen}
            onOpenChange={setDeclineOpen}
            onConfirm={handleDecline}
            isLoading={declineQuote.isPending}
          />
          <RequestChangesDialog
            open={changesOpen}
            onOpenChange={setChangesOpen}
            onConfirm={handleRequestChanges}
            isLoading={requestChanges.isPending}
          />
        </>
      )}
    </div>
  );
}
