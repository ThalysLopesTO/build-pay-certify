
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useEmployeeLimit = () => {
  const { user, isSuperAdmin } = useAuth();

  return useQuery({
    queryKey: ['employee-limit', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      console.log('🔍 Checking employee limit for company:', user.companyId);

      // Super admins have unlimited access
      if (isSuperAdmin) {
        const { data: employeeCount } = await supabase
          .rpc('get_company_employee_count', { company_id_param: user.companyId });

        return {
          plan: 'enterprise',
          planName: 'Super Admin',
          employeeLimit: null,
          currentCount: employeeCount || 0,
          canAddEmployee: true,
          remainingSlots: Infinity,
          subscriptionStatus: 'active'
        };
      }

      // Check for company subscription override
      const { data: company } = await supabase
        .from('companies')
        .select('subscription_override, plan_type, employee_limit')
        .eq('id', user.companyId)
        .single();

      // Get current employee count
      const { data: employeeCount, error: countError } = await supabase
        .rpc('get_company_employee_count', { company_id_param: user.companyId });

      if (countError) {
        throw countError;
      }

      const currentCount = employeeCount || 0;

      // If company has subscription override, use company settings
      if (company?.subscription_override) {
        const employeeLimit = company.employee_limit;
        const canAddEmployee = employeeLimit === null || currentCount < employeeLimit;

        const result = {
          plan: company.plan_type || 'enterprise',
          planName: company.plan_type === 'basic' ? 'Basic Plan (Override)' :
                    company.plan_type === 'premium' ? 'Premium Plan (Override)' :
                    company.plan_type === 'enterprise' ? 'Enterprise Plan (Override)' : 'Override Plan',
          employeeLimit,
          currentCount,
          canAddEmployee,
          remainingSlots: employeeLimit ? Math.max(0, employeeLimit - currentCount) : Infinity,
          subscriptionStatus: 'active'
        };

        console.log('✅ Company override employee limit data:', result);
        return result;
      }

      // Get subscription data
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', user.companyId)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      const employeeLimit = subscription?.employee_limit;
      const canAddEmployee = subscription?.status === 'active' && 
        (employeeLimit === null || currentCount < employeeLimit);

      const result = {
        plan: subscription?.plan_type || 'free',
        planName: subscription?.plan_type === 'basic' ? 'Basic Plan' :
                  subscription?.plan_type === 'premium' ? 'Premium Plan' :
                  subscription?.plan_type === 'enterprise' ? 'Enterprise Plan' : 'Free Plan',
        employeeLimit,
        currentCount,
        canAddEmployee,
        remainingSlots: employeeLimit ? Math.max(0, employeeLimit - currentCount) : Infinity,
        subscriptionStatus: subscription?.status || 'inactive'
      };

      console.log('✅ Employee limit data:', result);
      return result;
    },
    enabled: !!user?.companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};
