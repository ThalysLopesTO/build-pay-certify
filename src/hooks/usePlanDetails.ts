
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface PlanDetails {
  planType: string;
  planName: string;
  priceMonthly: number | null;
  employeeLimit: number | null;
  currentEmployeeCount: number;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  canAddEmployees: boolean;
}

export const usePlanDetails = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan-details', user?.companyId],
    queryFn: async (): Promise<PlanDetails | null> => {
      if (!user?.companyId) {
        return null;
      }

      const { data, error } = await supabase
        .rpc('get_company_plan_details', { company_id_param: user.companyId });

      if (error) {
        console.error('Error fetching plan details:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const planData = data[0];
      return {
        planType: planData.plan_type,
        planName: planData.plan_name,
        priceMonthly: planData.price_monthly,
        employeeLimit: planData.employee_limit,
        currentEmployeeCount: planData.current_employee_count,
        subscriptionStatus: planData.subscription_status,
        subscriptionEndDate: planData.subscription_end_date,
        canAddEmployees: planData.can_add_employees,
      };
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
