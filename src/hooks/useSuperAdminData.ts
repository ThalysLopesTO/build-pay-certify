
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationRequest {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_address: string | null;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  status: string;
  registration_date: string | null;
  expiration_date: string | null;
  created_at: string;
  is_expired: boolean;
  days_until_expiry: number | null;
  admin_user_id?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  admin_email?: string;
}

export const useSuperAdminData = () => {
  // Fetch registration requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['super-admin-registration-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_registration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RegistrationRequest[];
    }
  });

  // Fetch companies with status and admin user details
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['super-admin-companies'],
    queryFn: async () => {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          status,
          registration_date,
          expiration_date,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Calculate is_expired and days_until_expiry manually
      const companiesWithStatus = (companiesData || []).map(company => ({
        ...company,
        is_expired: company.expiration_date 
          ? new Date(company.expiration_date) < new Date() 
          : false,
        days_until_expiry: company.expiration_date
          ? Math.floor((new Date(company.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null
      }));

      // For each company, get the admin user details
      const companiesWithAdmins = await Promise.all(
        companiesWithStatus.map(async (company) => {
          const { data: adminProfile } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, email')
            .eq('company_id', company.id)
            .eq('role', 'admin')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          return {
            ...company,
            admin_user_id: adminProfile?.user_id,
            admin_first_name: adminProfile?.first_name,
            admin_last_name: adminProfile?.last_name,
            admin_email: adminProfile?.email,
          };
        })
      );

      return companiesWithAdmins as Company[];
    }
  });

  return {
    requests: requests || [],
    companies: companies || [],
    isLoading: requestsLoading || companiesLoading,
    pendingCount: requests?.filter(r => r.status === 'pending').length || 0
  };
};
