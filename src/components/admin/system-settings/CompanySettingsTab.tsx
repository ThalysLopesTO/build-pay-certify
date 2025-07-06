
import React from 'react';
import { useForm } from 'react-hook-form';
import { useCompanySettings, type CompanySettings as CompanySettingsType } from '@/hooks/useCompanySettings';
import CompanyBrandingSection from '../CompanyBrandingSection';
import { CompanyInformationForm } from './CompanyInformationForm';
import { WeekEndingDaySelector } from './WeekEndingDaySelector';
import { UsageInformation } from './UsageInformation';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Calendar } from 'lucide-react';

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
          <p className="text-foreground dark:text-white">Loading company settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Company Branding Section */}
      <Card className="border-border dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-foreground dark:text-white">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Company Branding</span>
          </CardTitle>
          <div className="h-px bg-border dark:bg-gray-700 mt-4"></div>
        </CardHeader>
        <CardContent className="pt-2">
          <CompanyBrandingSection />
        </CardContent>
      </Card>
      
      {/* Company Information Form with Week Ending Day */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CompanyInformationForm 
            form={form}
            onSubmit={onSubmit}
            isUpdating={isUpdating}
          />
          
          {/* Week Ending Day Section */}
          <Card className="border-border dark:border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-foreground dark:text-white">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Week Ending Day</span>
              </CardTitle>
              <div className="h-px bg-border dark:bg-gray-700 mt-4"></div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="max-w-xs">
                <WeekEndingDaySelector control={form.control} />
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                Select the day of the week when your work week ends for timesheet calculations.
              </p>
            </CardContent>
          </Card>

          {/* Usage Information */}
          <UsageInformation />

          {/* Save Button - Sticky positioned */}
          <div className="sticky bottom-0 mt-8 p-6 bg-background/95 dark:bg-gray-900/95 backdrop-blur border border-border dark:border-gray-700 rounded-lg shadow-lg">
            <Button 
              type="submit" 
              disabled={isUpdating} 
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              {isUpdating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  <span>Saving Changes...</span>
                </div>
              ) : (
                'Save Company Settings'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
