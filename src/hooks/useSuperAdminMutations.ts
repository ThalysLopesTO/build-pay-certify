
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useSuperAdminMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveRequestMutation = useMutation({
    mutationFn: async ({ request, registrationDate, expirationDate }: { 
      request: RegistrationRequest;
      registrationDate: string;
      expirationDate: string;
    }) => {
      // Create company with dates
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: request.company_name,
          status: 'active',
          registration_date: registrationDate,
          expiration_date: expirationDate
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request.admin_email,
        password: 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          first_name: request.admin_first_name,
          last_name: request.admin_last_name,
          role: 'admin'
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          company_id: companyData.id,
          role: 'admin',
          first_name: request.admin_first_name,
          last_name: request.admin_last_name,
          pending_approval: false
        });

      if (profileError) throw profileError;

      // Update registration request
      const { error: requestError } = await supabase
        .from('company_registration_requests')
        .update({ 
          status: 'approved',
          company_id: companyData.id,
          admin_user_id: authData.user.id
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      return { company: companyData, user: authData.user };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-registration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      toast({
        title: "Request Approved",
        description: "Company registration has been approved and accounts created successfully"
      });
    },
    onError: (error) => {
      console.error('Approval error:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the registration request. Please try again.",
        variant: "destructive"
      });
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (request: RegistrationRequest) => {
      const { error } = await supabase
        .from('company_registration_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-registration-requests'] });
      toast({
        title: "Request Rejected",
        description: "Company registration has been rejected"
      });
    },
    onError: (error) => {
      console.error('Rejection error:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the registration request",
        variant: "destructive"
      });
    }
  });

  return {
    approveRequestMutation,
    rejectRequestMutation
  };
};
