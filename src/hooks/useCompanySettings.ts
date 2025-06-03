
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface CompanySettings {
  id: string;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  hst_number: string | null;
  company_logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useCompanySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      console.log('Fetching company settings...');
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching company settings:', error);
        throw error;
      }

      console.log('Fetched company settings:', data);
      return data as CompanySettings;
    },
  });

  // Update company settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<CompanySettings>) => {
      console.log('Updating company settings:', updatedSettings);
      
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          ...updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings?.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company settings:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
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
