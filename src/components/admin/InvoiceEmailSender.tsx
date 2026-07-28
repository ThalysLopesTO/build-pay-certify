// ✅ FINAL CLEAN VERSION
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useEmailTemplate, getDefaultTemplate, replacePlaceholders } from '@/hooks/useEmailTemplates';
import { sendEmail } from '@/utils/sendEmail';
import { generateBrandedInvoicePDFBlob, blobToBase64 } from './BrandedInvoicePDF';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { Invoice } from './types/invoice';
import { format } from 'date-fns';
import { Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClient } from '@/hooks/useClient';
import { createInvoiceEmailHTML } from '@/utils/invoiceEmailTemplate';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceEmailSenderProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceEmailSender: React.FC<InvoiceEmailSenderProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { settings, isSettingsComplete } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();
  const { template } = useEmailTemplate('invoice');
  const { data: client, isLoading: isClientLoading } = useClient(invoice.client_id);
  const [isLoading, setIsLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  // Check if client portal URL is available (needed for Pay button)
  const hasPortalUrl = !!client?.portal_token;

  const generateClientPortalUrl = (): string | null => {
    const baseUrl = window.location.origin;
    if (client?.portal_token) {
      return `${baseUrl}/client/${client.portal_token}`;
    }
    return null;
  };

  // ✅ Generate subject & body text from template or fallback - memoized to react to client data changes
  const emailContent = useMemo(() => {
    if (!settings) return { subject: '', bodyText: '', html: '' };

    const emailTemplate = template || getDefaultTemplate('invoice');
    const portalUrl = generateClientPortalUrl();
    
    const templateData = {
      client_name: invoice.client_company,
      client_company: invoice.client_company,
      company_name: settings.company_name,
      company_address: settings.company_address || '',
      company_phone: settings.company_phone || '',
      invoice_number: invoice.invoice_number,
      project_name: invoice.jobsites?.name || 'your project',
      total_amount: invoice.total_amount.toFixed(2),
      due_date: format(new Date(invoice.due_date), 'MMM dd, yyyy'),
      hst_number: settings.hst_number || '',
      custom_message: customMessage || 'Thank you for your business.',
      portal_url: portalUrl || '',
    };

    const html = createInvoiceEmailHTML({
      clientName: invoice.client_company,
      companyName: settings.company_name,
      invoiceNumber: invoice.invoice_number,
      invoiceTitle: invoice.title,
      totalAmount: invoice.total_amount.toFixed(2),
      dueDate: format(new Date(invoice.due_date), 'MMM dd, yyyy'),
      portalUrl: portalUrl || undefined,
      companyLogoUrl: logoUrl || undefined,
      customMessage: customMessage || undefined,
      invoiceId: invoice.id,
    });

    return {
      subject: replacePlaceholders(emailTemplate.subject, templateData),
      bodyText: replacePlaceholders(emailTemplate.body_html, templateData),
      html,
    };
  }, [settings, template, client, customMessage, invoice, logoUrl]);

  const handleSendEmail = async () => {
    if (!isSettingsComplete()) {
      toast({
        title: 'Company Settings Incomplete',
        description: 'Please complete your company information in settings before sending invoices.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🚀 Starting invoice email send process:', {
      invoiceNumber: invoice.invoice_number,
      recipient: invoice.client_email,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    try {
      // ✅ Generate PDF attachment using professional template
      const { blob, filename } = await generateBrandedInvoicePDFBlob(invoice, settings, logoUrl);
      const base64Content = await blobToBase64(blob);

      // ✅ Send email with branding + PDF
      const emailResult = await sendEmail({
        to: invoice.client_email,
        subject: emailContent.subject,
        bodyText: emailContent.bodyText,
        customHtml: emailContent.html,
        companyData: {
          name: settings.company_name,
          address: settings.company_address,
          phone: settings.company_phone,
          logoUrl
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
        // A draft becomes a real, sent invoice once it reaches the client
        if (invoice.status === 'draft') {
          await supabase
            .from('invoices')
            .update({ status: 'pending', sent_date: new Date().toISOString() })
            .eq('id', invoice.id);
        }

        toast({
          title: 'Email Sent Successfully',
          description: `Invoice #${invoice.invoice_number} has been sent to ${invoice.client_email} with PDF attachment`,
        });
        onClose();
      } else {
        throw new Error(emailResult.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error Sending Email',
        description: error instanceof Error ? error.message : 'Failed to send invoice email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Send Invoice Email</span>
          </DialogTitle>
          <DialogDescription>
            Send Invoice #{invoice.invoice_number} to {invoice.client_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isClientLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Loading client portal information for payment link...
              </AlertDescription>
            </Alert>
          )}

          {!isClientLoading && !hasPortalUrl && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: Client portal token is missing. The "Pay Invoice" button won't appear in the email.
              </AlertDescription>
            </Alert>
          )}

          {!isSettingsComplete() && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please complete your company information in settings before sending invoices.
                Missing: {[
                  !settings?.company_name && 'Company Name',
                  !settings?.company_address && 'Address',
                  !settings?.company_email && 'Email',
                  !settings?.company_phone && 'Phone'
                ].filter(Boolean).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>To:</Label>
              <Input value={invoice.client_email} disabled />
            </div>
            <div>
              <Label>Subject:</Label>
              <Input 
                value={`Invoice #${invoice.invoice_number} from ${settings?.company_name || '[Company Name]'}`} 
                disabled 
              />
            </div>
          </div>

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
                  This text will be automatically wrapped in your company's branded email template when sent.
                </p>
              </div>

              {hasPortalUrl && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                    ✓ "Pay Invoice Now" button will be included in the email
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={isLoading || !isSettingsComplete() || isClientLoading}
          >
            {isLoading ? 'Sending Invoice...' : isClientLoading ? 'Loading...' : 'Send Invoice with PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
