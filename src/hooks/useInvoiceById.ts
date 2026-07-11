import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchInvoiceAttachments } from '@/hooks/useInvoiceAttachments';
import { InvoiceAttachment } from '@/components/admin/types/invoice';

export interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  client_company: string;
  client_email: string;
  client_address: string | null;
  client_phone: string | null;
  due_date: string;
  subtotal: number;
  tax: number | null;
  total_amount: number;
  status: string;
  notes: string | null;
  jobsites?: {
    name: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  taxRate: number;
  taxAmount: number;
  attachments?: InvoiceAttachment[];
}

export const useInvoiceById = (invoiceId: string | undefined) => {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          jobsites(name)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      const { data: lineItems, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (lineItemsError) throw lineItemsError;

      const items = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || 0,
        amount: item.amount
      }));

      const taxRate = invoiceData.tax || 0;
      const taxAmount = (invoiceData.subtotal * taxRate) / 100;

      const attachments = await fetchInvoiceAttachments(invoiceId);

      return {
        ...invoiceData,
        items,
        taxRate,
        taxAmount,
        attachments
      } as Invoice;
    },
    enabled: !!invoiceId,
  });

  return { invoice, loading: isLoading };
};