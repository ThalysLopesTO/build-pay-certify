
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

      // Get company details with plan and employee_limit
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('plan, employee_limit')
        .eq('id', user.companyId)
        .single();

      if (companyError) {
        console.error('Error fetching company:', companyError);
        throw companyError;
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
        employeeLimit: company.employee_limit,
        currentCount: currentCount || 0,
        canAddEmployee: canAdd || false,
        remainingSlots: Math.max(0, (company.employee_limit || 0) - (currentCount || 0))
      };

      console.log('✅ Employee limit data:', result);
      return result;
    },
    enabled: !!user?.companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};
