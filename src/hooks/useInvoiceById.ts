import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  client_company: string;
  client_email: string;
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
        quantity: 1,
        unitPrice: item.amount,
        amount: item.amount
      }));

      const taxRate = invoiceData.tax || 0;
      const taxAmount = (invoiceData.subtotal * taxRate) / 100;

      return {
        ...invoiceData,
        items,
        taxRate,
        taxAmount
      } as Invoice;
    },
    enabled: !!invoiceId,
  });

  return { invoice, loading: isLoading };
};