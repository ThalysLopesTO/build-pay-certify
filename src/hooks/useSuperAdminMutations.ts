
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as CryptoJS from "crypto-js";
import { SECRET_KEY } from './useCompanyRegistration';

interface RegistrationRequest {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_address: string | null;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_password?: string;
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

      // Step 1: Fetch default rule first
      let defaultRuleContent = null;
      try {
        const { data: defaultRule, error: ruleError } = await supabase
          .from('default_rules')
          .select('content')
          .limit(1)
          .single();

        if (ruleError) {
          console.error('Error fetching default rule:', ruleError);
        } else if (defaultRule?.content) {
          defaultRuleContent = defaultRule.content;
          console.log('Default rule fetched successfully');
        }
      } catch (ruleApplyError) {
        console.error('Unexpected error fetching default rules:', ruleApplyError);
      }

      // Step 2: Create the company
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

      const encrypted = request?.admin_password ?? "TempPassword123!";
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const originalText = decrypted.toString(CryptoJS.enc.Utf8);

      // Step 3: Use the edge function to create the admin user with company ID and company name
      const { data: createUserData, error: createUserError } = await supabase.functions.invoke('create-super-admin', {
        body: { 
          email: request.admin_email,
          password: originalText,
          firstName: request.admin_first_name,
          lastName: request.admin_last_name,
          companyId: companyData.id,
          companyName: request.company_name // Pass company name for email
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

      console.log('created admin: ',{createUserData})

      // Step 4: Create company_settings entry with default rules
      try {
        const { error: settingsError } = await supabase
          .from('company_settings')
          .insert({
            company_id: companyData.id,
            company_name: request.company_name,
            company_email: request.company_email,
            company_phone: request.company_phone,
            company_address: request.company_address,
            company_rules_text: defaultRuleContent
          });

        if (settingsError) {
          console.error('Error creating company settings:', settingsError);
          // Don't fail the function, just log the error
        } else if (defaultRuleContent) {
          console.log('Company settings created with default rules applied for company:', companyData.id);
        } else {
          console.log('Company settings created (no default rules available) for company:', companyData.id);
        }
      } catch (settingsCreateError) {
        console.error('Unexpected error creating company settings:', settingsCreateError);
        // Continue with function execution
      }

      // Step 5: Update the registration request to approved status
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
        description: `${data.company.name} has been approved and the admin account created successfully. Welcome email sent to the administrator.`
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
