import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getEdgeFunctionError } from '@/lib/edgeError';

interface SyncAuthEmailParams {
  userId: string;
  email: string;
}

export function useSyncAuthEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, email }: SyncAuthEmailParams) => {
      const { data, error } = await supabase.functions.invoke(
        'update-user-email',
        { body: { userId, newEmail: email } }
      );

      if (error) throw new Error(await getEdgeFunctionError(error, 'Failed to sync login email.'));
      if (!data?.success) throw new Error(data?.error || 'Failed to sync email');
      
      return data;
    },
    onSuccess: () => {
      toast.success('Login Email Synced', {
        description: 'The login email has been successfully synchronized.',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error('Sync Failed', {
        description: error.message || 'Failed to sync login email.',
      });
    },
  });
}
