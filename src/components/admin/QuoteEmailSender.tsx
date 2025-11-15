import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { sendEmail } from '@/utils/sendEmail';
import { generateQuotePDFBlob, blobToBase64 } from '@/utils/quotePDFGenerator';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useQuoteLineItems, useUpdateQuote } from '@/hooks/quotes';
import { Quote } from '@/hooks/quotes/types';
import { format } from 'date-fns';
import { Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createQuoteEmailHTML, getQuoteEmailSubject } from '@/utils/quoteEmailTemplate';
import { v4 as uuidv4 } from 'uuid';
import { useClient } from '@/hooks/useClient';

interface QuoteEmailSenderProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteEmailSender: React.FC<QuoteEmailSenderProps> = ({
  quote,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { settings, isSettingsComplete } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { data: lineItems = [] } = useQuoteLineItems(quote.id);
  const { data: client } = useClient(quote.client_id);
  const updateQuote = useUpdateQuote();
  const [isLoading, setIsLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const generatePublicQuoteUrl = (): string => {
    const baseUrl = window.location.origin;
    // Link to client portal if client exists, otherwise fallback to individual quote
    if (client?.portal_token) {
      return `${baseUrl}/client/${client.portal_token}`;
    }
    const token = quote.public_token || uuidv4();
    return `${baseUrl}/public/quote/${token}`;
  };

  const generateEmailContent = () => {
    if (!settings) return { subject: '', html: '' };

    const publicQuoteUrl = generatePublicQuoteUrl();

    const subject = getQuoteEmailSubject(settings.company_name, quote.quote_number);

    const html = createQuoteEmailHTML({
      clientName: quote.client_name,
      companyName: settings.company_name,
      projectName: quote.project_name,
      quoteNumber: quote.quote_number,
      totalAmount: quote.total_amount.toFixed(2),
      expiryDate: quote.expiry_date 
        ? format(new Date(quote.expiry_date), 'MMM dd, yyyy') 
        : 'No expiry date',
      publicQuoteUrl,
      companyLogoUrl: logoUrl || undefined,
      customMessage: customMessage || undefined,
    });

    return { subject, html };
  };

  const handleSendEmail = async () => {
    if (!isSettingsComplete()) {
      toast({
        title: 'Company Settings Incomplete',
        description: 'Please complete your company information in settings before sending quotes.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Ensure quote has public_token and update status
      const tokenToUse = quote.public_token || uuidv4();
      
      if (!quote.public_token || quote.status !== 'sent') {
        console.log('Updating quote status and ensuring public_token...');
        await updateQuote.mutateAsync({
          id: quote.id,
          updates: {
            public_token: tokenToUse,
            status: 'sent',
            public_status: 'awaiting_response',
            sent_date: new Date().toISOString(),
          }
        });
      }

      // Step 2: Generate email content with public URL
      const emailContent = generateEmailContent();

      // Step 3: Generate PDF attachment
      const { blob, filename } = await generateQuotePDFBlob(
        quote, 
        lineItems, 
        settings, 
        logoUrl
      );
      const base64Content = await blobToBase64(blob);

      // Step 4: Send email with new template and PDF attachment
      const emailResult = await sendEmail({
        to: quote.client_email,
        subject: emailContent.subject,
        bodyText: '', // Not used when customHtml is provided
        companyData: {
          name: settings.company_name,
          address: settings.company_address,
          phone: settings.company_phone,
          logoUrl
        },
        customHtml: emailContent.html,
        attachments: [
          {
            filename,
            content: base64Content,
            type: 'application/pdf'
          }
        ]
      });

      if (emailResult.success) {
        toast({
          title: 'Quote Sent Successfully',
          description: `Quote ${quote.quote_number} has been sent to ${quote.client_email}`,
        });
        onClose();
      } else {
        throw new Error(emailResult.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending quote email:', error);
      toast({
        title: 'Error Sending Quote',
        description: error instanceof Error ? error.message : 'Failed to send quote email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const emailContent = generateEmailContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Send Quote Email</span>
          </DialogTitle>
          <DialogDescription>
            Send Quote {quote.quote_number} to {quote.client_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isSettingsComplete() && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please complete your company information in settings before sending quotes.
                Missing: {[
                  !settings?.company_name && 'Company Name',
                  !settings?.company_address && 'Address',
                  !settings?.company_email && 'Email',
                  !settings?.company_phone && 'Phone'
                ].filter(Boolean).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="custom-message">Additional Message (Optional):</Label>
            <Textarea
              id="custom-message"
              placeholder="Add any additional message for the client..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Email Preview:</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Subject:</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm">
                  {emailContent.subject}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Message:</Label>
                <div className="mt-1 p-3 bg-muted rounded text-sm max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground mb-2">
                    ✉️ Branded email with "View Quote Online" button
                  </p>
                  <div className="space-y-2">
                    <p><strong>To:</strong> {quote.client_name} ({quote.client_email})</p>
                    <p><strong>Project:</strong> {quote.project_name}</p>
                    <p><strong>Total:</strong> ${quote.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-2">
                      🔗 Includes link to public quote page where client can approve or request changes
                    </p>
                    <p className="text-xs text-blue-600">
                      📎 PDF attachment included for client records
                    </p>
                    {customMessage && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <strong>Your message:</strong> {customMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={isLoading || !isSettingsComplete()}
          >
            {isLoading ? 'Sending Quote...' : 'Send Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
