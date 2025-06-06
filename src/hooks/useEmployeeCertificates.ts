
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface Certificate {
  id: string;
  employee_id: string;
  certificate_name: string;
  certificate_type: string;
  expiry_date: string;
  upload_date: string;
  file_url: string | null;
  status: 'valid' | 'expiring' | 'expired';
  created_at: string;
}

export const useEmployeeCertificates = (employeeId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch certificates for a specific employee
  const { data: certificates = [], isLoading, error } = useQuery({
    queryKey: ['employee-certificates', employeeId, user?.companyId],
    queryFn: async () => {
      if (!employeeId || !user?.companyId) {
        return [];
      }

      console.log('Fetching certificates for employee:', employeeId);

      const { data, error } = await supabase
        .from('employee_certificates')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
      }

      console.log('Fetched certificates:', data);
      return data as Certificate[];
    },
    enabled: !!employeeId && !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete certificate mutation
  const deleteCertificateMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      // First get the certificate to delete the file
      const { data: certificate } = await supabase
        .from('employee_certificates')
        .select('file_url')
        .eq('id', certificateId)
        .single();

      // Delete the file from storage if it exists
      if (certificate?.file_url) {
        const fileName = certificate.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('certificates')
            .remove([fileName]);
        }
      }

      // Delete the certificate record
      const { error } = await supabase
        .from('employee_certificates')
        .delete()
        .eq('id', certificateId)
        .eq('company_id', user?.companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['employee-certificates', employeeId, user?.companyId] 
      });
      toast({
        title: 'Certificate Deleted',
        description: 'Certificate has been removed successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting certificate:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete certificate. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteCertificate = (certificateId: string) => {
    deleteCertificateMutation.mutate(certificateId);
  };

  const refreshCertificates = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['employee-certificates', employeeId, user?.companyId] 
    });
  };

  return {
    certificates,
    isLoading,
    error,
    deleteCertificate,
    refreshCertificates,
    isDeletingCertificate: deleteCertificateMutation.isPending
  };
};
