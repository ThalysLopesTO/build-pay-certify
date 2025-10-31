import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/config/subscriptionPlans';

export interface CompanyPlanData {
  currentPlan: SubscriptionPlan | null;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
  employeeLimit: number;
  currentEmployeeCount: number;
  remainingSlots: number;
  trialEndDate: string | null;
  gracePeriodEndDate: string | null;
  subscriptionEndDate: string | null;
  availableUpgrades: SubscriptionPlan[];
  isInTrial: boolean;
  isInGracePeriod: boolean;
  daysUntilExpiry: number | null;
}

export const useCompanyPlan = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['company-plan', user?.companyId],
    queryFn: async (): Promise<CompanyPlanData | null> => {
      if (!user?.companyId) {
        return null;
      }

      // Fetch company details
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('plan, subscription_status, employee_limit, trial_end_date, grace_period_end_date, expiration_date, created_at')
        .eq('id', user.companyId)
        .single();

      if (companyError || !company) {
        console.error('Error fetching company plan:', companyError);
        return null;
      }

      // Get current employee count
      const { data: employeeCount, error: countError } = await supabase
        .rpc('get_company_employee_count', { company_uuid: user.companyId });

      if (countError) {
        console.error('Error fetching employee count:', countError);
      }

      const currentCount = employeeCount || 0;

      // Handle legacy trial cases: companies with plan='free' within 7 days of creation
      const now = new Date();
      const createdAt = company.created_at ? new Date(company.created_at) : now;
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));
      const isLegacyTrial = company.plan === 'free' && daysSinceCreation <= 7;

      // Determine effective plan
      let effectivePlan = company.plan;
      let effectiveTrialEndDate = company.trial_end_date;
      
      if (isLegacyTrial) {
        effectivePlan = 'start'; // Default to start plan for trials
        effectiveTrialEndDate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Map company plan to subscription plan config
      const currentPlan = effectivePlan && effectivePlan !== 'free' 
        ? SUBSCRIPTION_PLANS[effectivePlan as keyof typeof SUBSCRIPTION_PLANS] || null
        : null;

      // Calculate available upgrades
      const availableUpgrades: SubscriptionPlan[] = [];
      if (currentPlan) {
        const allPlans = Object.values(SUBSCRIPTION_PLANS);
        availableUpgrades.push(
          ...allPlans.filter(plan => plan.price > currentPlan.price)
        );
      } else {
        // If no current plan, show all plans
        availableUpgrades.push(...Object.values(SUBSCRIPTION_PLANS));
      }

      // Calculate trial/expiry info
      const isInTrial = (company.subscription_status === 'trialing' && 
                        company.trial_end_date && 
                        new Date(company.trial_end_date) > now) ||
                        isLegacyTrial;

      const isInGracePeriod = company.subscription_status === 'past_due' &&
                              company.grace_period_end_date &&
                              new Date(company.grace_period_end_date) > now;

      let daysUntilExpiry: number | null = null;
      if (isInTrial && effectiveTrialEndDate) {
        const timeDiff = new Date(effectiveTrialEndDate).getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      } else if (isInGracePeriod && company.grace_period_end_date) {
        const timeDiff = new Date(company.grace_period_end_date).getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      } else if (company.expiration_date) {
        const timeDiff = new Date(company.expiration_date).getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      return {
        currentPlan,
        subscriptionStatus: isLegacyTrial ? 'trialing' : (company.subscription_status || 'inactive'),
        employeeLimit: company.employee_limit || (currentPlan?.employeeLimit || 0),
        currentEmployeeCount: currentCount,
        remainingSlots: Math.max(0, (company.employee_limit || currentPlan?.employeeLimit || 0) - currentCount),
        trialEndDate: effectiveTrialEndDate,
        gracePeriodEndDate: company.grace_period_end_date,
        subscriptionEndDate: company.expiration_date,
        availableUpgrades,
        isInTrial,
        isInGracePeriod,
        daysUntilExpiry,
      };
    },
    enabled: !!user?.companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};
