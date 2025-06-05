
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface LicenseStatus {
  isActive: boolean;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean; // within 7 days
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

      const { data: company, error } = await supabase
        .from('companies')
        .select('license_expires_at')
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
      const expiresAt = company.license_expires_at ? new Date(company.license_expires_at) : null;
      
      if (!expiresAt) {
        // No expiration date means active
        return {
          isActive: true,
          expiresAt: null,
          daysUntilExpiry: null,
          isExpiringSoon: false,
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
      };
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
