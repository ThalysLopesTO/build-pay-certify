
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditCompanyData {
  name: string;
  email: string;
  phone?: string;
}

export const useCompanyMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editCompanyMutation = useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: EditCompanyData }) => {
      console.log('Updating company:', companyId, data);

      // Update company name
      const { error: companyError } = await supabase
        .from('companies')
        .update({ name: data.name })
        .eq('id', companyId);

      if (companyError) {
        console.error('Company update error:', companyError);
        throw new Error(`Failed to update company: ${companyError.message}`);
      }

      // Update company settings (email and phone)
      const { error: settingsError } = await supabase
        .from('company_settings')
        .upsert({
          company_id: companyId,
          company_name: data.name,
          company_email: data.email,
          company_phone: data.phone || null,
        });

      if (settingsError) {
        console.error('Company settings update error:', settingsError);
        throw new Error(`Failed to update company settings: ${settingsError.message}`);
      }

      console.log('Company updated successfully');
      return { companyId, data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-registration-requests'] });
      toast({
        title: "Company Updated",
        description: `${result.data.name} has been updated successfully.`
      });
      console.log('Company update completed successfully:', result);
    },
    onError: (error) => {
      console.error('Company update failed:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update the company. Please try again.",
        variant: "destructive"
      });
    }
  });

  const revokeCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      console.log('Revoking company access:', companyId);

      // Update company status to revoked
      const { error } = await supabase
        .from('companies')
        .update({ status: 'revoked' })
        .eq('id', companyId);

      if (error) {
        console.error('Company revocation error:', error);
        throw new Error(`Failed to revoke company access: ${error.message}`);
      }

      console.log('Company access revoked successfully');
      return companyId;
    },
    onSuccess: (companyId) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-registration-requests'] });
      toast({
        title: "Company Access Revoked",
        description: "Company access has been revoked successfully. All users from this company are now restricted from the platform."
      });
      console.log('Company revocation completed successfully:', companyId);
    },
    onError: (error) => {
      console.error('Company revocation failed:', error);
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke company access. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    editCompanyMutation,
    revokeCompanyMutation
  };
};
