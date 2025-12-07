import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PortalQuote {
  id: string;
  quote_number: string;
  project_name: string;
  quote_date: string;
  expiry_date: string | null;
  status: string;
  public_status: string | null;
  total_amount: number;
  public_token: string | null;
  notes: string | null;
  client_address: string | null;
  client_viewed_at: string | null;
  client_approved_at: string | null;
  client_declined_at: string | null;
  client_name_signed: string | null;
  accepted_date: string | null;
  declined_date: string | null;
  client_change_request: string | null;
  client_change_requested_at: string | null;
}

interface PortalInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PortalInvoice {
  id: string;
  invoice_number: string;
  title: string;
  due_date: string;
  status: string;
  total_amount: number;
  sent_date: string | null;
  notes: string | null;
  client_address: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number | null;
  line_items: PortalInvoiceLineItem[];
}

interface ClientPortalData {
  client: {
    id: string;
    client_name: string;
    client_company: string | null;
    client_email: string;
    client_phone: string | null;
    client_address: string | null;
  };
  quotes: PortalQuote[];
  invoices: PortalInvoice[];
  company_settings: {
    company_name: string;
    company_logo_url: string | null;
    company_email: string | null;
    company_phone: string | null;
    company_address: string | null;
    timezone?: string;
  };
}

export const useClientPortal = (token: string | undefined) => {
  return useQuery({
    queryKey: ['client-portal', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      const { data, error } = await supabase.rpc('get_client_portal_data', {
        p_portal_token: token
      });

      if (error) throw error;
      return data as ClientPortalData;
    },
    enabled: !!token,
    retry: false,
  });
};
