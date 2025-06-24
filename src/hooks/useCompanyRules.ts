
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface CompanyRulesData {
  id: string;
  company_rules_text: string | null;
  updated_at: string | null;
}

export const useCompanyRules = () => {
  const { user } = useAuth();

  const { data: rules, isLoading, error } = useQuery({
    queryKey: ['company-rules', user?.companyId],
    queryFn: async () => {
      console.log('Fetching company rules for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return null;
      }
      
      // Get rules from company_settings (should exist due to trigger)
      const { data, error } = await supabase
        .from('company_settings')
        .select('id, company_rules_text, updated_at')
        .eq('company_id', user.companyId)
        .single();

      if (error) {
        console.error('Error fetching company rules:', error);
        throw error;
      }

      console.log('Fetched company rules:', data);
      return data as CompanyRulesData;
    },
    enabled: !!user?.companyId,
  });

  return {
    rules,
    isLoading,
    error,
  };
};

export const useUpdateCompanyRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rulesText: string) => {
      console.log('Updating company rules:', rulesText);
      
      if (!user?.companyId) {
        throw new Error('Company ID is required to update rules');
      }
      
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          company_rules_text: rulesText,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', user.companyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating company rules:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-rules', user?.companyId] });
      toast({
        title: 'Rules Updated',
        description: 'Company rules have been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error updating company rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to update company rules. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
