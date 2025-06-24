
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Send, Download, Trash2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Quote, useUpdateQuote, useDeleteQuote, useConvertQuoteToInvoice } from '@/hooks/useQuotes';
import { useToast } from '@/hooks/use-toast';
import QuotePDFGenerator from './QuotePDFGenerator';

interface QuoteActionsProps {
  quote: Quote;
  onEdit: (quote: Quote) => void;
  onRefresh: () => void;
}

const QuoteActions: React.FC<QuoteActionsProps> = ({ quote, onEdit, onRefresh }) => {
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const convertToInvoice = useConvertQuoteToInvoice();
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: 'sent' | 'accepted' | 'declined') => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'sent') {
        updates.sent_date = new Date().toISOString();
      } else if (newStatus === 'accepted') {
        updates.accepted_date = new Date().toISOString();
      } else if (newStatus === 'declined') {
        updates.declined_date = new Date().toISOString();
      }

      await updateQuote.mutateAsync({ id: quote.id, updates });
      onRefresh();
    } catch (error) {
      console.error('Failed to update quote status:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await deleteQuote.mutateAsync(quote.id);
        onRefresh();
      } catch (error) {
        console.error('Failed to delete quote:', error);
      }
    }
  };

  const handleSendQuote = () => {
    // This would integrate with an email service
    toast({
      title: "Quote Sent",
      description: `Quote ${quote.quote_number} has been sent to ${quote.client_email}`,
    });
    handleStatusChange('sent');
  };

  const handleConvertToInvoice = async () => {
    if (window.confirm('Convert this quote to an invoice? This action cannot be undone.')) {
      await convertToInvoice.mutateAsync(quote.id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <QuotePDFGenerator quote={quote} />
      
      {/* Show convert to invoice button for accepted quotes that haven't been converted */}
      {quote.status === 'accepted' && !quote.invoice_id && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleConvertToInvoice}
          disabled={convertToInvoice.isPending}
        >
          <FileText className="mr-2 h-4 w-4" />
          Convert to Invoice
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {quote.status !== 'invoiced' && (
            <DropdownMenuItem onClick={() => onEdit(quote)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          
          {quote.status === 'draft' && (
            <DropdownMenuItem onClick={handleSendQuote}>
              <Send className="mr-2 h-4 w-4" />
              Send Quote
            </DropdownMenuItem>
          )}
          
          {quote.status === 'sent' && (
            <>
              <DropdownMenuItem onClick={() => handleStatusChange('accepted')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Accepted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('declined')}>
                <XCircle className="mr-2 h-4 w-4" />
                Mark Declined
              </DropdownMenuItem>
            </>
          )}

          {/* Allow conversion from dropdown for sent quotes as well */}
          {(quote.status === 'sent' || quote.status === 'accepted') && !quote.invoice_id && (
            <DropdownMenuItem onClick={handleConvertToInvoice}>
              <FileText className="mr-2 h-4 w-4" />
              Convert to Invoice
            </DropdownMenuItem>
          )}
          
          {quote.status !== 'accepted' && quote.status !== 'invoiced' && (
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default QuoteActions;
