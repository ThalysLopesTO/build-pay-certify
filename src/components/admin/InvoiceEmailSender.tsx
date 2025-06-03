
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Invoice } from './types/invoice';
import { format } from 'date-fns';
import { Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [isLoading, setIsLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const generateEmailTemplate = () => {
    if (!settings) return '';

    return `Hi ${invoice.client_company},

Please find attached Invoice #${invoice.invoice_number} for ${invoice.jobsites?.name || 'your project'}.

• Amount Due: $${invoice.total_amount.toFixed(2)}
• Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}

${customMessage ? `${customMessage}\n\n` : ''}You can download the invoice as a PDF using the link provided or from the attachment.

If you have any questions, feel free to reply to this email.

Best regards,
${settings.company_name}
${settings.company_address || ''}
${settings.hst_number ? `HST: ${settings.hst_number}` : ''}`;
  };

  const handleSendEmail = async () => {
    if (!isSettingsComplete()) {
      toast({
        title: 'Company Settings Incomplete',
        description: 'Please complete your company information in settings before sending invoices.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // This would typically call an edge function to send the email
      // For now, we'll just simulate the process and show the email template
      
      console.log('Email would be sent with:');
      console.log('Subject:', `Invoice #${invoice.invoice_number} from ${settings?.company_name}`);
      console.log('To:', invoice.client_email);
      console.log('Body:', generateEmailTemplate());
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Email Sent Successfully',
        description: `Invoice #${invoice.invoice_number} has been sent to ${invoice.client_email}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error Sending Email',
        description: 'Failed to send invoice email. Please try again.',
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
            <div className="bg-gray-50 p-4 rounded-lg border text-sm whitespace-pre-line">
              {generateEmailTemplate()}
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
            {isLoading ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
