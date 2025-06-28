
// Helper to fix all company-related property references
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useCompanyPropertiesFixer = () => {
  const { user } = useAuth();
  
  // Return correctly named properties for use throughout the app
  return {
    companyId: user?.company_id,
    companyName: user?.company_name,
    firstName: user?.first_name,
    lastName: user?.last_name,
    hourlyRate: user?.hourly_rate,
    hasUser: !!user,
    isAuthenticated: !!user
  };
};
