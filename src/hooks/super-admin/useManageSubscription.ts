import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionUpdate {
  plan?: string | null;
  subscription_status?: string | null;
  status?: string | null;
  expiration_date?: string | null;
  trial_end_date?: string | null;
  employee_limit?: number | null;
}

/**
 * Super-admin membership/subscription control — writes the subscription fields
 * on the companies row directly (plan, status, dates, seat limit).
 */
export const useManageSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, updates }: { companyId: string; updates: SubscriptionUpdate }) => {
      const { error } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', companyId);
      if (error) throw error;
      return companyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      toast({
        title: 'Membership updated',
        description: 'The company subscription has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update the subscription.',
        variant: 'destructive',
      });
    },
  });
};
