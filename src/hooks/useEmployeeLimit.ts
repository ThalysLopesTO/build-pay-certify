import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

export const useEmployeeLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-limit', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        throw new Error('Company ID is required');
      }

      console.log('🔍 Checking employee limit for company:', user.companyId);

      // Get company details with plan, employee_limit, and created_at
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('plan, employee_limit, created_at')
        .eq('id', user.companyId)
        .single();

      if (companyError) {
        console.error('Error fetching company:', companyError);
        throw companyError;
      }

      // Check for legacy trial (free plan created within 7 days)
      const now = new Date();
      const createdAt = company.created_at ? new Date(company.created_at) : now;
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));
      const isLegacyTrial = company.plan === 'free' && daysSinceCreation <= 7;

      // Determine effective employee limit
      let effectiveEmployeeLimit = company.employee_limit;
      if (isLegacyTrial) {
        effectiveEmployeeLimit = SUBSCRIPTION_PLANS.start.employeeLimit; // Use Start plan's 5 employee limit
      }

      // Get current employee count using the database function
      const { data: currentCount, error: countError } = await supabase
        .rpc('get_company_employee_count', { company_id_param: user.companyId });

      if (countError) {
        console.error('Error getting employee count:', countError);
        throw countError;
      }

      // Check if company can add more employees
      const { data: canAdd, error: canAddError } = await supabase
        .rpc('can_add_employee', { company_id_param: user.companyId });

      if (canAddError) {
        console.error('Error checking if can add employee:', canAddError);
        throw canAddError;
      }

      const result = {
        plan: company.plan,
        employeeLimit: effectiveEmployeeLimit,
        currentCount: currentCount || 0,
        canAddEmployee: canAdd || false,
        remainingSlots: Math.max(0, (effectiveEmployeeLimit || 0) - (currentCount || 0))
      };

      console.log('✅ Employee limit data:', result);
      return result;
    },
    enabled: !!user?.companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};
