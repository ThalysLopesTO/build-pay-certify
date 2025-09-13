import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface Certificate {
  id: string;
  certificate_name: string;
  certificate_type: string;
  expiry_date: string;
  status: string;
}

const calculateCertificateStatus = (certificates: Certificate[]): string => {
  if (certificates.length === 0) return 'no-certificates';
  
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Check for expired certificates first
  for (const cert of certificates) {
    // Never expires certificates are always valid
    if (cert.certificate_type === 'no-expiry') continue;
    
    const expiryDate = new Date(cert.expiry_date);
    if (expiryDate < now) return 'expired';
  }
  
  // Check for expiring soon certificates
  for (const cert of certificates) {
    if (cert.certificate_type === 'no-expiry') continue;
    
    const expiryDate = new Date(cert.expiry_date);
    if (expiryDate <= thirtyDaysFromNow) return 'expiring';
  }
  
  return 'all-valid';
};

export const useEmployeeCertificateStatus = (employeeId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-certificate-status', employeeId, user?.companyId],
    queryFn: async () => {
      if (!employeeId || !user?.companyId) {
        return 'no-certificates';
      }

      const { data: certificates, error } = await supabase
        .from('employee_certificates')
        .select('id, certificate_name, certificate_type, expiry_date, status')
        .eq('employee_id', employeeId)
        .eq('company_id', user.companyId);

      if (error) {
        console.error('Error fetching certificates:', error);
        return 'no-certificates';
      }

      return calculateCertificateStatus(certificates || []);
    },
    enabled: !!employeeId && !!user?.companyId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};