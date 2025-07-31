
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Edit, Send, FileText, Trash2, CheckCircle, XCircle, Download } from 'lucide-react';
import { Quote, useUpdateQuote, useDeleteQuote, useConvertQuoteToInvoice } from '@/hooks/quotes';
import { useToast } from '@/hooks/use-toast';
import QuotePDFGenerator from './QuotePDFGenerator';
import { QuoteEmailSender } from '../QuoteEmailSender';

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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleStatusChange = async (newStatus: 'draft' | 'sent' | 'accepted' | 'declined') => {
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
      
      toast({
        title: "Status Updated",
        description: `Quote status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Failed to update quote status:', error);
      toast({
        title: "Error",
        description: "Failed to update quote status",
        variant: "destructive",
      });
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
    setIsEmailModalOpen(true);
  };

  const handleEmailSent = () => {
    setIsEmailModalOpen(false);
    handleStatusChange('sent');
    onRefresh();
  };

  const handleConvertToInvoice = async () => {
    if (window.confirm('Convert this quote to an invoice? This action cannot be undone.')) {
      await convertToInvoice.mutateAsync(quote.id);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Convert to Invoice - Prominent placement for accepted quotes */}
      {quote.status === 'accepted' && !quote.invoice_id && (
        <Button 
          variant="default" 
          size="sm"
          onClick={handleConvertToInvoice}
          disabled={convertToInvoice.isPending}
          className="shadow-sm"
        >
          <FileText className="mr-1 h-3 w-3" />
          Convert to Invoice
        </Button>
      )}
      
      {/* Quick actions */}
      <QuotePDFGenerator quote={quote} />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {quote.status !== 'invoiced' && (
            <DropdownMenuItem onClick={() => onEdit(quote)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Quote
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {quote.status === 'draft' && (
            <DropdownMenuItem onClick={handleSendQuote}>
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </DropdownMenuItem>
          )}
          
          {quote.status === 'sent' && (
            <>
              <DropdownMenuItem onClick={() => handleStatusChange('accepted')}>
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                Mark as Approved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('declined')}>
                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                Mark as Rejected
              </DropdownMenuItem>
            </>
          )}

          {/* Status Change Section */}
          {quote.status !== 'invoiced' && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Change Status</div>
              <Select
                value={quote.status}
                onValueChange={(value) => handleStatusChange(value as 'draft' | 'sent' | 'accepted' | 'declined')}
                disabled={updateQuote.isPending}
              >
                <SelectTrigger className="mx-2 my-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Approved</SelectItem>
                  <SelectItem value="declined">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {/* Convert option for sent quotes */}
          {quote.status === 'sent' && !quote.invoice_id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleConvertToInvoice}>
                <FileText className="mr-2 h-4 w-4" />
                Convert to Invoice
              </DropdownMenuItem>
            </>
          )}
          
          {quote.status !== 'accepted' && quote.status !== 'invoiced' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Quote
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <QuoteEmailSender
        quote={quote}
        isOpen={isEmailModalOpen}
        onClose={handleEmailSent}
      />
    </div>
  );
};

export default QuoteActions;
