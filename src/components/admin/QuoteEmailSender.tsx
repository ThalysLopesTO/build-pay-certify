import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useEmailTemplate, getDefaultTemplate, replacePlaceholders } from '@/hooks/useEmailTemplates';
import { sendEmail } from '@/utils/sendEmail';
import { generateQuotePDFBlob, blobToBase64 } from '@/utils/quotePDFGenerator';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useQuoteLineItems } from '@/hooks/quotes';
import { Quote } from '@/hooks/quotes/types';
import { format } from 'date-fns';
import { Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { logoUrl } = useCompanyLogo(); // ✅ using the shared hook for logo
  const { data: lineItems = [] } = useQuoteLineItems(quote.id);
  const { template } = useEmailTemplate('quote');
  const [isLoading, setIsLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  // ✅ Generate subject & body text for the email
  const generateEmailContent = () => {
    if (!settings) return { subject: '', bodyText: '' };

    const emailTemplate = template || getDefaultTemplate('quote');

    const templateData = {
      client_name: quote.client_name,
      client_company: quote.client_company || quote.client_name,
      company_name: settings.company_name,
      company_address: settings.company_address || '',
      company_phone: settings.company_phone || '',
      quote_number: quote.quote_number,
      project_name: quote.project_name,
      total_amount: quote.total_amount.toFixed(2),
      expiry_date: quote.expiry_date ? format(new Date(quote.expiry_date), 'MMM dd, yyyy') : 'No expiry',
      hst_number: settings.hst_number || '',
      custom_message: customMessage || 'Thank you for considering our services.',
    };

    return {
      subject: replacePlaceholders(emailTemplate.subject, templateData),
      bodyText: replacePlaceholders(emailTemplate.body_html, templateData),
    };
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
      const emailContent = generateEmailContent();

      // ✅ Generate PDF attachment for quote
      const { blob, filename } = await generateQuotePDFBlob(quote, lineItems, settings, logoUrl);
      const base64Content = await blobToBase64(blob);

      // ✅ Send email with branded wrapper & PDF
      const emailResult = await sendEmail({
        to: quote.client_email,
        subject: emailContent.subject,
        bodyText: emailContent.bodyText,
        companyData: {
          name: settings.company_name,
          address: settings.company_address,
          phone: settings.company_phone,
          logoUrl // ✅ consistent with InvoiceEmailSender
        },
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
          description: `Quote ${quote.quote_number} has been sent to ${quote.client_email} with PDF attachment`,
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
                <Label className="text-sm font-medium">Body (Preview):</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm max-h-32 overflow-y-auto">
                  {emailContent.bodyText}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This text will be automatically wrapped in your company’s branded email template when sent.
                </p>
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
            {isLoading ? 'Sending Quote...' : 'Send Quote with PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
