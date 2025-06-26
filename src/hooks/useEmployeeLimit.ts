
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useEmployeeLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-limit', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      console.log('🔍 Checking employee limit for company:', user.companyId);

      // Get company plan details using the new function
      const { data: planDetails, error: planError } = await supabase
        .rpc('get_company_plan_details', { company_id_param: user.companyId });

      if (planError) {
        console.error('Error fetching plan details:', planError);
        throw planError;
      }

      if (!planDetails || planDetails.length === 0) {
        throw new Error('No plan details found');
      }

      const details = planDetails[0];

      const result = {
        plan: details.plan_type,
        planName: details.plan_name,
        employeeLimit: details.employee_limit,
        currentCount: details.current_employee_count || 0,
        canAddEmployee: details.can_add_employees || false,
        remainingSlots: details.employee_limit ? Math.max(0, details.employee_limit - (details.current_employee_count || 0)) : Infinity,
        subscriptionStatus: details.subscription_status
      };

      console.log('✅ Employee limit data:', result);
      return result;
    },
    enabled: !!user?.companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};
