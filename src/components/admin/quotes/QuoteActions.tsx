
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from opening editor
    
    const message = quote.status === 'invoiced' 
      ? 'This quote has been converted to an invoice. Are you sure you want to delete it? This will not delete the invoice.'
      : 'Are you sure you want to delete this quote?';
      
    if (window.confirm(message)) {
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

  const handleEmailSent = async () => {
    setIsEmailModalOpen(false);
    await handleStatusChange('sent');
  };

  const handleConvertToInvoice = async () => {
    if (window.confirm('Convert this quote to an invoice? This action cannot be undone.')) {
      try {
        await convertToInvoice.mutateAsync(quote.id);
      } catch (error) {
        console.error('Failed to convert quote to invoice:', error);
        toast({
          title: "Error",
          description: "Failed to convert quote to invoice",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Convert to Invoice - Prominent placement for accepted/approved quotes */}
      {(quote.status === 'accepted' || quote.public_status === 'approved') && !quote.invoice_id && (
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
          {quote.status === 'invoiced' && quote.invoice_id && (
            <DropdownMenuItem onClick={() => {
              window.location.href = `/admin/dashboard?tab=invoices&invoice=${quote.invoice_id}`;
            }}>
              <FileText className="mr-2 h-4 w-4" />
              View Invoice
            </DropdownMenuItem>
          )}
          
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

          {/* Individual status change options */}
          {quote.status !== 'invoiced' && (
            <>
              <DropdownMenuSeparator />
              {quote.status !== 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Change to Draft
                </DropdownMenuItem>
              )}
              {quote.status !== 'sent' && (
                <DropdownMenuItem onClick={() => handleStatusChange('sent')}>
                  <Send className="mr-2 h-4 w-4" />
                  Change to Sent
                </DropdownMenuItem>
              )}
              {quote.status !== 'accepted' && (
                <DropdownMenuItem onClick={() => handleStatusChange('accepted')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                  Change to Approved
                </DropdownMenuItem>
              )}
              {quote.status !== 'declined' && (
                <DropdownMenuItem onClick={() => handleStatusChange('declined')}>
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  Change to Rejected
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Convert option for sent/accepted/approved quotes */}
          {(quote.status === 'sent' || quote.status === 'accepted' || quote.public_status === 'approved') && !quote.invoice_id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleConvertToInvoice}>
                <FileText className="mr-2 h-4 w-4" />
                Convert to Invoice
              </DropdownMenuItem>
            </>
          )}
          
          {quote.status !== 'accepted' && quote.public_status !== 'approved' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => handleDelete(e)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Quote{quote.status === 'invoiced' && ' (Already Invoiced)'}
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
