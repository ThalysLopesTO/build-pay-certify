import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Permanently delete a company and all of its members. Calls the delete-company
 * edge function (service role + super-admin guard + name confirmation).
 */
export const useDeleteCompany = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, confirmName }: { companyId: string; confirmName: string }) => {
      const { data, error } = await supabase.functions.invoke('delete-company', {
        body: { companyId, confirmName },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { company: string; deletedUsers: number; totalUsers: number; failures: string[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-platform-users'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-company-usage'] });
      const partial = data.failures?.length
        ? ` (${data.failures.length} auth account${data.failures.length !== 1 ? 's' : ''} could not be removed)`
        : '';
      toast({
        title: 'Company deleted',
        description: `${data.company} and ${data.deletedUsers}/${data.totalUsers} member account(s) were permanently removed${partial}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Could not delete the company.',
        variant: 'destructive',
      });
    },
  });
};
