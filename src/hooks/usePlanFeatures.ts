import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PlanFeatures } from '@/config/subscriptionPlans';

export const usePlanFeatures = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan-features', user?.companyId],
    queryFn: async (): Promise<PlanFeatures> => {
      if (!user?.companyId) {
        return {
          billsExpenses: false,
          materialRequests: false,
          personalSupport: false,
          customSupport: false,
        };
      }

      const { data: company, error } = await supabase
        .from('companies')
        .select('plan, plan_features')
        .eq('id', user.companyId)
        .single();

      if (error || !company) {
        console.error('Error fetching plan features:', error);
        return {
          billsExpenses: false,
          materialRequests: false,
          personalSupport: false,
          customSupport: false,
        };
      }

      // Return plan_features from database if available
      if (company.plan_features) {
        return company.plan_features as PlanFeatures;
      }

      // Fallback logic for companies without plan_features set
      return {
        billsExpenses: company.plan !== 'free' && company.plan !== 'start',
        materialRequests: company.plan !== 'free' && company.plan !== 'start',
        personalSupport: company.plan === 'builder' || company.plan === 'builder_pro',
        customSupport: company.plan === 'builder_pro',
      };
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
