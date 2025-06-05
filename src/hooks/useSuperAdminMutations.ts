
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
      console.log('Starting approval process for:', request.company_name);

      // Step 1: Create the company first
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

      if (companyError) {
        console.error('Company creation error:', companyError);
        throw new Error(`Failed to create company: ${companyError.message}`);
      }

      console.log('Company created successfully:', companyData);

      // Step 2: Use the edge function to create the admin user
      const { data: createUserData, error: createUserError } = await supabase.functions.invoke('create-super-admin', {
        body: { 
          email: request.admin_email,
          password: 'TempPassword123!',
          firstName: request.admin_first_name,
          lastName: request.admin_last_name
        }
      });

      if (createUserError) {
        console.error('User creation error:', createUserError);
        // Clean up the company if user creation fails
        await supabase.from('companies').delete().eq('id', companyData.id);
        throw new Error(`Failed to create admin user: ${createUserError.message}`);
      }

      if (createUserData.error) {
        console.error('Edge function error:', createUserData.error);
        // Clean up the company if user creation fails
        await supabase.from('companies').delete().eq('id', companyData.id);
        throw new Error(`Failed to create admin user: ${createUserData.error}`);
      }

      console.log('Admin user created successfully:', createUserData);

      // Step 3: Update the user profile to link to the correct company and set role to admin
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          company_id: companyData.id,
          role: 'admin',
          first_name: request.admin_first_name,
          last_name: request.admin_last_name,
          pending_approval: false
        })
        .eq('user_id', createUserData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Clean up created resources
        await supabase.from('companies').delete().eq('id', companyData.id);
        throw new Error(`Failed to update user profile: ${profileError.message}`);
      }

      console.log('User profile updated successfully');

      // Step 4: Update the registration request to approved status
      const { error: requestError } = await supabase
        .from('company_registration_requests')
        .update({ 
          status: 'approved',
          company_id: companyData.id,
          admin_user_id: createUserData.user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (requestError) {
        console.error('Registration request update error:', requestError);
        throw new Error(`Failed to update registration request: ${requestError.message}`);
      }

      console.log('Registration request updated successfully');

      return { 
        company: companyData, 
        user: createUserData.user,
        message: 'Company registration approved successfully'
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-registration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      toast({
        title: "Request Approved",
        description: `${data.company.name} has been approved and the admin account created successfully.`
      });
      console.log('Approval completed successfully:', data);
    },
    onError: (error) => {
      console.error('Approval process failed:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve the registration request. Please try again.",
        variant: "destructive"
      });
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (request: RegistrationRequest) => {
      const { error } = await supabase
        .from('company_registration_requests')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) {
        console.error('Rejection error:', error);
        throw new Error(`Failed to reject request: ${error.message}`);
      }
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
        description: error.message || "Failed to reject the registration request",
        variant: "destructive"
      });
    }
  });

  return {
    approveRequestMutation,
    rejectRequestMutation
  };
};
