import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Calendar, MapPin, ExternalLink, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useApproveQuote, useRequestChanges, useDeclineQuote } from '@/hooks/quotes/useQuoteActions';
import { ApproveQuoteDialog, DeclineQuoteDialog, RequestChangesDialog } from './QuoteActionDialogs';
import { useToast } from '@/hooks/use-toast';

interface PortalQuoteCardProps {
  quote: {
    id: string;
    quote_number: string;
    project_name: string;
    quote_date: string;
    expiry_date: string | null;
    status: string;
    public_status: string | null;
    total_amount: number;
    public_token: string | null;
    notes: string | null;
    client_address: string | null;
    client_viewed_at: string | null;
    client_approved_at: string | null;
    client_declined_at: string | null;
  };
}

export function PortalQuoteCard({ quote }: PortalQuoteCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [changesDialogOpen, setChangesDialogOpen] = useState(false);

  const approveQuote = useApproveQuote();
  const requestChanges = useRequestChanges();
  const declineQuote = useDeclineQuote();

  const getStatusColor = (status: string, publicStatus?: string | null) => {
    if (publicStatus === 'approved' || status === 'accepted') return 'bg-green-600';
    if (publicStatus === 'declined' || status === 'declined') return 'bg-red-600';
    if (publicStatus === 'changes_requested') return 'bg-blue-600';
    if (publicStatus === 'awaiting_response' || status === 'sent') return 'bg-orange-600';
    return 'bg-gray-600';
  };

  const canTakeAction = () => {
    return (quote.status === 'sent' || quote.public_status === 'awaiting_response') &&
           !quote.client_approved_at && 
           !quote.client_declined_at;
  };

  const handleApprove = async (signedName: string) => {
    if (!quote.public_token) return;
    
    try {
      await approveQuote.mutateAsync({ token: quote.public_token, signedName });
      toast({
        title: 'Quote Approved',
        description: 'Thank you! Your approval has been sent successfully.',
      });
      setApproveDialogOpen(false);
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
      setDeclineDialogOpen(false);
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
        description: 'Your request has been sent. We\'ll review and get back to you.',
      });
      setChangesDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleView = () => {
    if (quote.public_token) {
      navigate(`/quote/${quote.public_token}`);
    }
  };

  return (
    <>
      <div className="bg-card border rounded-lg p-6 hover:shadow-lg hover:scale-[1.02] transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">{quote.quote_number}</h3>
            </div>
            <p className="text-foreground font-medium mb-1">{quote.project_name}</p>
            {quote.client_address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" />
                {quote.client_address}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Sent {format(new Date(quote.quote_date), 'MMM d, yyyy')}
            </p>
          </div>
          <Badge className={`${getStatusColor(quote.status, quote.public_status)} text-white border-0`}>
            {quote.client_approved_at ? 'Approved' : quote.client_declined_at ? 'Declined' : quote.public_status === 'changes_requested' ? 'Changes Requested' : quote.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-b mb-4">
          <div className="text-sm text-muted-foreground">Total amount</div>
          <div className="text-2xl font-bold">${quote.total_amount.toFixed(2)}</div>
        </div>

        {quote.expiry_date && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Expires {format(new Date(quote.expiry_date), 'MMM d, yyyy')}
            </p>
          </div>
        )}

        {canTakeAction() ? (
          <div className="space-y-2">
            <Button 
              onClick={() => setApproveDialogOpen(true)} 
              className="w-full bg-green-600 hover:bg-green-700" 
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Quote
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={() => setChangesDialogOpen(true)} 
                variant="outline" 
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Changes
              </Button>
              <Button 
                onClick={() => setDeclineDialogOpen(true)} 
                variant="destructive" 
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        ) : quote.public_token && (
          <Button onClick={handleView} className="w-full" size="lg">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Quote
          </Button>
        )}
      </div>

      <ApproveQuoteDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={handleApprove}
        isLoading={approveQuote.isPending}
      />
      
      <DeclineQuoteDialog
        open={declineDialogOpen}
        onOpenChange={setDeclineDialogOpen}
        onConfirm={handleDecline}
        isLoading={declineQuote.isPending}
      />
      
      <RequestChangesDialog
        open={changesDialogOpen}
        onOpenChange={setChangesDialogOpen}
        onConfirm={handleRequestChanges}
        isLoading={requestChanges.isPending}
      />
    </>
  );
}
