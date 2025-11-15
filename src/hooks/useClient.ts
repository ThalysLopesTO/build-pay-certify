import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  client_phone: string | null;
  client_address: string | null;
  portal_token: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export const useClient = (clientId: string | null | undefined) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!clientId,
  });
};
