
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { autoSendInvoiceEmail } from '@/utils/autoSendInvoiceEmail';
import { Invoice } from '@/components/admin/types/invoice';
import { CompanySettings } from '@/hooks/useCompanySettings';

export const useConvertQuoteToInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      // Convert the quote to invoice using the database function
      const { data, error } = await supabase.rpc('convert_quote_to_invoice', {
        quote_id_param: quoteId
      });

      if (error) {
        throw error;
      }

      const invoiceId = data as string;

      // Fetch the newly created invoice with line items
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_line_items (*)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) {
        throw new Error(`Failed to fetch invoice: ${invoiceError.message}`);
      }

      // Get company settings
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', invoice.company_id)
        .single();

      if (settingsError) {
        console.warn('Could not fetch company settings:', settingsError.message);
      }

      // Get company logo
      const { data: company } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', invoice.company_id)
        .single();

      const logoUrl = company?.logo_url || null;

      // Get client portal token if client_id exists
      let portalUrl: string | undefined;
      if (invoice.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('portal_token')
          .eq('id', invoice.client_id)
          .single();

        if (client?.portal_token) {
          const baseUrl = window.location.origin;
          portalUrl = `${baseUrl}/client/${client.portal_token}/invoices`;
        }
      }

      // Send the invoice email automatically
      const typedInvoice: Invoice = {
        ...invoice,
        status: invoice.status as Invoice['status'],
        invoice_line_items: invoice.invoice_line_items || []
      };

      const emailResult = await autoSendInvoiceEmail(
        typedInvoice,
        settings as CompanySettings | null,
        logoUrl,
        portalUrl
      );

      return {
        invoiceId,
        emailSent: emailResult.success,
        emailError: emailResult.error
      };
    },
    onSuccess: (result, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      if (result.emailSent) {
        toast({
          title: "Success",
          description: "Quote converted to invoice and email sent to client",
        });
      } else {
        toast({
          title: "Quote Converted",
          description: result.emailError 
            ? `Invoice created but email failed: ${result.emailError}`
            : "Invoice created but email could not be sent",
          variant: "default",
        });
      }
      
      // Navigate to invoice management with the new invoice
      window.location.href = `/admin/dashboard?tab=invoices&invoice=${result.invoiceId}`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to convert quote: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
