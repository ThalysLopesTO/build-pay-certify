
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface LicenseStatus {
  isActive: boolean;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean; // within 7 days
  subscriptionStatus?: {
    subscribed: boolean;
    plan: string;
    subscription_end: string | null;
  };
}

export const useLicenseStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['license-status', user?.companyId],
    queryFn: async (): Promise<LicenseStatus> => {
      if (!user?.companyId) {
        return {
          isActive: false,
          expiresAt: null,
          daysUntilExpiry: null,
          isExpiringSoon: false,
        };
      }

      // Get company details including Stripe status
      const { data: company, error } = await supabase
        .from('companies')
        .select('license_expires_at, stripe_verified, stripe_subscription_id, plan, expiration_date')
        .eq('id', user.companyId)
        .single();

      if (error || !company) {
        console.error('Error fetching company license:', error);
        return {
          isActive: false,
          expiresAt: null,
          daysUntilExpiry: null,
          isExpiringSoon: false,
        };
      }

      const now = new Date();
      
      // Check if company has active Stripe subscription
      const hasActiveStripeSubscription = company.stripe_verified && 
        company.stripe_subscription_id && 
        company.plan !== 'free';

      // If company has active Stripe subscription, check expiration date
      if (hasActiveStripeSubscription && company.expiration_date) {
        const expiresAt = new Date(company.expiration_date);
        const isActive = expiresAt > now;
        const timeDiff = expiresAt.getTime() - now.getTime();
        const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const isExpiringSoon = isActive && daysUntilExpiry <= 7;

        return {
          isActive,
          expiresAt: company.expiration_date,
          daysUntilExpiry: isActive ? daysUntilExpiry : null,
          isExpiringSoon,
          subscriptionStatus: {
            subscribed: true,
            plan: company.plan || 'pro',
            subscription_end: company.expiration_date,
          },
        };
      }

      // Fallback to license_expires_at for legacy companies
      const expiresAt = company.license_expires_at ? new Date(company.license_expires_at) : null;
      
      if (!expiresAt) {
        // No expiration date means active (legacy behavior)
        return {
          isActive: true,
          expiresAt: null,
          daysUntilExpiry: null,
          isExpiringSoon: false,
          subscriptionStatus: {
            subscribed: hasActiveStripeSubscription,
            plan: company.plan || 'free',
            subscription_end: company.expiration_date,
          },
        };
      }

      const isActive = expiresAt > now;
      const timeDiff = expiresAt.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const isExpiringSoon = isActive && daysUntilExpiry <= 7;

      return {
        isActive,
        expiresAt: company.license_expires_at,
        daysUntilExpiry: isActive ? daysUntilExpiry : null,
        isExpiringSoon,
        subscriptionStatus: {
          subscribed: hasActiveStripeSubscription,
          plan: company.plan || 'free',
          subscription_end: company.expiration_date || company.license_expires_at,
        },
      };
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
