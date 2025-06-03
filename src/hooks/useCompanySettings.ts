
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface CompanySettings {
  id: string;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  hst_number: string | null;
  company_logo_url: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useCompanySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch company settings with company isolation
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['company-settings', user?.companyId],
    queryFn: async () => {
      console.log('Fetching company settings for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return null;
      }
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user.companyId)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return null to trigger creation
          console.log('No company settings found, will need to create');
          return null;
        }
        console.error('Error fetching company settings:', error);
        throw error;
      }

      console.log('Fetched company settings:', data);
      return data as CompanySettings;
    },
    enabled: !!user?.companyId,
  });

  // Update company settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<CompanySettings>) => {
      console.log('Updating company settings:', updatedSettings);
      
      if (!user?.companyId) {
        throw new Error('Company ID is required to update settings');
      }
      
      if (settings?.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('company_settings')
          .update({
            ...updatedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)
          .eq('company_id', user.companyId)
          .select()
          .single();

        if (error) {
          console.error('Error updating company settings:', error);
          throw error;
        }

        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('company_settings')
          .insert({
            ...updatedSettings,
            company_id: user.companyId,
            company_name: updatedSettings.company_name || user.companyName || 'Unnamed Company'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating company settings:', error);
          throw error;
        }

        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', user?.companyId] });
      toast({
        title: 'Settings Updated',
        description: 'Company settings have been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error updating company settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update company settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const isSettingsComplete = () => {
    if (!settings) return false;
    
    return !!(
      settings.company_name &&
      settings.company_address &&
      settings.company_email &&
      settings.company_phone
    );
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    isSettingsComplete,
  };
};
