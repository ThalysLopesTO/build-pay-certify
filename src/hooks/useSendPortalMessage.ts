import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SendPortalMessageParams {
  portalToken: string;
  subject: string;
  message: string;
}

export const useSendPortalMessage = () => {
  return useMutation({
    mutationFn: async ({ portalToken, subject, message }: SendPortalMessageParams) => {
      const { data, error } = await supabase.rpc('send_portal_message', {
        p_portal_token: portalToken,
        p_subject: subject,
        p_message: message,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Get client info from portal data
      const { data: portalData } = await supabase.rpc('get_client_portal_data', {
        p_portal_token: portalToken
      });

      if (portalData) {
        const clientData = portalData as any;
        // Trigger notification email
        await supabase.functions.invoke('send-quote-notification', {
          body: {
            action: 'message_sent',
            clientName: clientData.client?.client_name,
            subject,
            message,
            companyId: clientData.client?.company_id,
          },
        });
      }

      return result;
    },
  });
};
