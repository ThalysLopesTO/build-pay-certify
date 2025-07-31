
import React from 'react';
import { useForm } from 'react-hook-form';
import { useCompanySettings, type CompanySettings as CompanySettingsType } from '@/hooks/useCompanySettings';
import CompanyBrandingSection from '../CompanyBrandingSection';
import { CompanyInformationForm } from './CompanyInformationForm';
import { WeekEndingDaySelector } from './WeekEndingDaySelector';
import { UsageInformation } from './UsageInformation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Building2, Calendar, Eye, Bell } from 'lucide-react';

export const CompanySettingsTab = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  
  const form = useForm<Partial<CompanySettingsType>>({
    defaultValues: {
      company_name: settings?.company_name || '',
      company_address: settings?.company_address || '',
      company_phone: settings?.company_phone || '',
      company_email: settings?.company_email || '',
      hst_number: settings?.hst_number || '',
      company_rules_text: settings?.company_rules_text || '',
      week_ending_day: settings?.week_ending_day ?? 0,
      show_tax_breakdown_to_employees: settings?.show_tax_breakdown_to_employees ?? true,
      enable_invoice_reminders: settings?.enable_invoice_reminders ?? true,
      invoice_reminder_days_before: settings?.invoice_reminder_days_before ?? 3,
      invoice_overdue_reminder_days: settings?.invoice_overdue_reminder_days ?? 7,
      enable_quote_reminders: settings?.enable_quote_reminders ?? true,
      quote_reminder_days: settings?.quote_reminder_days ?? 14,
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
        company_rules_text: settings.company_rules_text || '',
        week_ending_day: settings.week_ending_day ?? 0,
        show_tax_breakdown_to_employees: settings.show_tax_breakdown_to_employees ?? true,
        enable_invoice_reminders: settings.enable_invoice_reminders ?? true,
        invoice_reminder_days_before: settings.invoice_reminder_days_before ?? 3,
        invoice_overdue_reminder_days: settings.invoice_overdue_reminder_days ?? 7,
        enable_quote_reminders: settings.enable_quote_reminders ?? true,
        quote_reminder_days: settings.quote_reminder_days ?? 14,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: Partial<CompanySettingsType>) => {
    updateSettings(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Loading Settings</h3>
            <p className="text-muted-foreground">Please wait while we fetch your company settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
          <p className="text-muted-foreground">Configure your company information, branding, and operational preferences.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Company Branding Section */}
            <Card className="shadow-sm border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  Company Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CompanyBrandingSection />
              </CardContent>
            </Card>
            
            {/* Company Information */}
            <CompanyInformationForm 
              form={form}
              onSubmit={onSubmit}
              isUpdating={isUpdating}
            />
            
            {/* Week Ending Day Section */}
            <Card className="shadow-sm border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  Week Ending Day
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-sm">
                  <WeekEndingDaySelector control={form.control} />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Select the day of the week when your work week ends for timesheet calculations.
                </p>
              </CardContent>
            </Card>

            {/* Employee Settings */}
            <Card className="shadow-sm border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  Employee Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="show_tax_breakdown_to_employees"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start justify-between rounded-lg border border-border p-6 bg-muted/30">
                      <div className="space-y-1 flex-1">
                        <FormLabel className="text-base font-medium">
                          Show Tax Breakdown to Employees
                        </FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          When enabled, employees will see detailed tax calculations (gross pay, estimated tax, and net pay) in their timesheet submissions. When disabled, employees will only see gross pay and net pay totals.
                        </FormDescription>
                      </div>
                      <FormControl className="ml-6">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Reminder Settings */}
            <Card className="shadow-sm border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  Automated Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Invoice Reminders */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="enable_invoice_reminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start justify-between rounded-lg border border-border p-4 bg-muted/30">
                        <div className="space-y-1 flex-1">
                          <FormLabel className="text-base font-medium">
                            Enable Invoice Reminders
                          </FormLabel>
                          <FormDescription className="text-sm text-muted-foreground">
                            Automatically send email reminders to clients for upcoming and overdue invoices.
                          </FormDescription>
                        </div>
                        <FormControl className="ml-6">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoice_reminder_days_before"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days Before Due Date</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              placeholder="3"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                            />
                          </FormControl>
                          <FormDescription>
                            Send reminder this many days before invoice due date
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="invoice_overdue_reminder_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days After Due Date</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              placeholder="7"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                            />
                          </FormControl>
                          <FormDescription>
                            Send overdue reminder this many days after due date
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Quote Reminders */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <FormField
                    control={form.control}
                    name="enable_quote_reminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start justify-between rounded-lg border border-border p-4 bg-muted/30">
                        <div className="space-y-1 flex-1">
                          <FormLabel className="text-base font-medium">
                            Enable Quote Reminders
                          </FormLabel>
                          <FormDescription className="text-sm text-muted-foreground">
                            Automatically send follow-up emails to clients for pending quotes.
                          </FormDescription>
                        </div>
                        <FormControl className="ml-6">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="max-w-md">
                    <FormField
                      control={form.control}
                      name="quote_reminder_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days After Quote Date</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="60"
                              placeholder="14"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 14)}
                            />
                          </FormControl>
                          <FormDescription>
                            Send follow-up reminder this many days after quote was sent
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Information */}
            <UsageInformation />

            {/* Save Button - Fixed at bottom */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-6 -mx-6">
              <div className="max-w-5xl mx-auto">
                <Button 
                  type="submit" 
                  disabled={isUpdating} 
                  size="lg"
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
                      <span>Saving Changes...</span>
                    </div>
                  ) : (
                    'Save Company Settings'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
