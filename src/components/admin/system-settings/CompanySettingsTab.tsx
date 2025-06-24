
import React from 'react';
import { useForm } from 'react-hook-form';
import { useCompanySettings, type CompanySettings as CompanySettingsType } from '@/hooks/useCompanySettings';
import CompanyBrandingSection from '../CompanyBrandingSection';
import { CompanyInformationForm } from './CompanyInformationForm';
import { WeekEndingDaySelector } from './WeekEndingDaySelector';
import { UsageInformation } from './UsageInformation';
import { Form } from '@/components/ui/form';

export const CompanySettingsTab = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  
  const form = useForm<Partial<CompanySettingsType & { website?: string; social_media?: string }>>({
    defaultValues: {
      company_name: settings?.company_name || '',
      company_address: settings?.company_address || '',
      company_phone: settings?.company_phone || '',
      company_email: settings?.company_email || '',
      hst_number: settings?.hst_number || '',
      website: '',
      social_media: '',
      company_rules_text: settings?.company_rules_text || '',
      week_ending_day: settings?.week_ending_day ?? 0,
    }
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name,
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        hst_number: settings.hst_number || '',
        website: '',
        social_media: '',
        company_rules_text: settings.company_rules_text || '',
        week_ending_day: settings.week_ending_day ?? 0,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: Partial<CompanySettingsType>) => {
    updateSettings(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading company settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Branding Section */}
      <CompanyBrandingSection />
      
      {/* Company Information Form with Week Ending Day */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CompanyInformationForm 
            form={form}
            onSubmit={onSubmit}
            isUpdating={isUpdating}
          />
          
          {/* Week Ending Day in a separate section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div></div>
            <div></div>
            <WeekEndingDaySelector control={form.control} />
          </div>

          <UsageInformation />
        </form>
      </Form>
    </div>
  );
};
