/* eslint-disable @typescript-eslint/no-explicit-any */

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
  company_rules_text: string | null;
  week_ending_day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  timesheet_frequency: 'weekly' | 'bi-weekly'; // Timesheet period frequency
  timezone: string; // Company's business timezone
  tax_percentage: number; // Tax percentage for timesheet calculations
  show_tax_breakdown_to_employees: boolean; // Whether to show tax breakdown to employees
  enable_invoice_reminders: boolean; // Whether to enable invoice reminders
  invoice_reminder_days_before: number; // Days before due date to send reminder
  invoice_overdue_reminder_days: number; // Days after due date to send overdue reminder
  enable_quote_reminders: boolean; // Whether to enable quote reminders
  quote_reminder_days: number; // Days after quote date to send reminder
  enable_quote_expiry_reminders: boolean; // Whether to enable quote expiry reminders
  quote_expiry_reminder_days_before: number; // Days before expiry to send reminder
  webhook_url: string | null; // Webhook endpoint URL for daily summaries
  webhook_secret: string | null; // Secret key for webhook signature verification
  webhook_enabled: boolean; // Whether webhooks are enabled
  weather_latitude: number | null; // Latitude for company weather location
  weather_longitude: number | null; // Longitude for company weather location
  weather_location_name: string | null; // Human-readable weather location name
  start_date?: string;
  created_at: string;
  updated_at: string;
}

export const useCompanySettings = () => {
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
    isSettingsComplete,
  };
};


export const useUpdateSettingsMutation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedSettings: Partial<CompanySettings>) => {
      console.log("Updating company settings:", updatedSettings);

      if (!user?.companyId) {
        throw new Error("Company ID is required to update settings");
      }

      // Clean up empty strings for timestamp fields
      const cleanedSettings = {
        ...updatedSettings,
        start_date: updatedSettings.start_date === "" ? null : updatedSettings.start_date,
      };

      // if id exists, use update; otherwise upsert (insert)
      if (cleanedSettings.id) {
        const { data, error } = await supabase
          .from("company_settings")
          .update({
            ...cleanedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cleanedSettings.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating company settings by id:", error);
          throw error;
        }

        return data;
      } else {
        const { data, error } = await supabase
          .from("company_settings")
          .upsert(
            {
              company_id: user.companyId,
              company_name: cleanedSettings.company_name || user.companyName || "Unnamed Company",
              week_ending_day: cleanedSettings.week_ending_day ?? 0,
              timesheet_frequency: (cleanedSettings as any)?.timesheet_frequency ?? "weekly",
              updated_at: new Date().toISOString(),
              ...cleanedSettings,
            },
            { onConflict: "company_id" }
          )
          .select()
          .single();

        if (error) {
          console.error("Error upserting company settings:", error);
          throw error;
        }

        return data;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"], exact: false });
      toast({
        title: "Settings Updated",
        description: "Company settings have been updated successfully.",
      });
    },

    onError: (error) => {
      console.error("Error updating company settings:", error);
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive",
      });
    },
  });
} 