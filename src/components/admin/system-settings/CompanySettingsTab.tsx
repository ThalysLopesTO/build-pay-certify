/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCompanySettings, useUpdateSettingsMutation, type CompanySettings as CompanySettingsType } from '@/hooks/useCompanySettings';
import CompanyBrandingSection from '../CompanyBrandingSection';
import { CompanyInformationForm } from './CompanyInformationForm';
import { WeekEndingDaySelector } from './WeekEndingDaySelector';
import { UsageInformation } from './UsageInformation';
import { CompanyRulesTab as CompanyRulesSection } from './CompanyRulesTab';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Building2, Eye, Bell, Clock, CalendarIcon, Webhook, Key, Link2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { TIMEZONE_OPTIONS } from '@/utils/timezone';
import { Popover } from '@radix-ui/react-popover';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

export const CompanySettingsTab = () => {
  const { settings, isLoading } = useCompanySettings();
  const [selectedDate, setSelectedDate] = useState<Date>()
  const updateSettings = useUpdateSettingsMutation()
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<Partial<CompanySettingsType>>({
    defaultValues: {
      company_name: settings?.company_name || '',
      company_address: settings?.company_address || '',
      company_phone: settings?.company_phone || '',
      company_email: settings?.company_email || '',
      hst_number: settings?.hst_number || '',
      company_rules_text: settings?.company_rules_text || '',
      week_ending_day: settings?.week_ending_day ?? 0,
      timezone: settings?.timezone || 'America/Toronto',
      show_tax_breakdown_to_employees: settings?.show_tax_breakdown_to_employees ?? true,
      enable_invoice_reminders: settings?.enable_invoice_reminders ?? true,
      invoice_reminder_days_before: settings?.invoice_reminder_days_before ?? 3,
      invoice_overdue_reminder_days: settings?.invoice_overdue_reminder_days ?? 7,
      enable_quote_reminders: settings?.enable_quote_reminders ?? true,
      quote_reminder_days: settings?.quote_reminder_days ?? 14,
      enable_quote_expiry_reminders: settings?.enable_quote_expiry_reminders ?? true,
      quote_expiry_reminder_days_before: settings?.quote_expiry_reminder_days_before ?? 3,
      timesheet_frequency: (settings as any)?.timesheet_frequency || 'weekly',
      start_date: settings?.start_date || null,
      webhook_url: settings?.webhook_url || '',
      webhook_secret: settings?.webhook_secret || '',
      webhook_enabled: settings?.webhook_enabled ?? false,
    }
  });

  useEffect(() => {
    const date = settings?.start_date ? new Date(settings?.start_date) : new Date();
    setSelectedDate(date);
  }, [settings])

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
        timezone: settings.timezone || 'America/Toronto',
        show_tax_breakdown_to_employees: settings.show_tax_breakdown_to_employees ?? true,
        enable_invoice_reminders: settings.enable_invoice_reminders ?? true,
        invoice_reminder_days_before: settings.invoice_reminder_days_before ?? 3,
        invoice_overdue_reminder_days: settings.invoice_overdue_reminder_days ?? 7,
        enable_quote_reminders: settings.enable_quote_reminders ?? true,
        quote_reminder_days: settings.quote_reminder_days ?? 14,
        enable_quote_expiry_reminders: settings.enable_quote_expiry_reminders ?? true,
        quote_expiry_reminder_days_before: settings.quote_expiry_reminder_days_before ?? 3,
        timesheet_frequency: (settings as any)?.timesheet_frequency || 'weekly',
        start_date: settings.start_date || null,
        webhook_url: settings.webhook_url || '',
        webhook_secret: settings.webhook_secret || '',
        webhook_enabled: settings.webhook_enabled ?? false,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: Partial<CompanySettingsType>) => {
    // Filter out empty strings and convert them to null for timestamp fields
    const cleanedData = {
      ...data,
      start_date: data.start_date === "" ? null : data.start_date
    };
    updateSettings.mutate({id: settings.id, ...cleanedData});
  };

  function handleDateSelect(e: Date) {
    form.setValue("start_date", e.toISOString());
    setSelectedDate(e);
  }

  const handleTestWebhook = async () => {
    const webhookUrl = form.getValues('webhook_url');
    const webhookSecret = form.getValues('webhook_secret');
    
    if (!webhookUrl) {
      toast({
        title: "Webhook URL Required",
        description: "Please enter a webhook URL before testing.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Testing Webhook",
        description: "Sending test payload to your webhook URL...",
      });

      const { data, error } = await supabase.functions.invoke('send-daily-webhook', {
        body: { 
          company_id: user?.companyId,
          date: format(new Date(), 'yyyy-MM-dd'),
          webhookUrl,
          webhookSecret,
          isTest: true
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Check if webhook delivery succeeded
      if (data.success) {
        toast({
          title: "Webhook Test Successful",
          description: `Test payload delivered successfully (HTTP ${data.statusCode}). Check your webhook endpoint for the received data.`,
        });
      } else {
        // Webhook delivery failed - show detailed error
        const errorMsg = data.statusCode 
          ? `HTTP ${data.statusCode}: ${data.error || 'Unknown error'}`
          : data.error || 'Failed to reach webhook endpoint';
          
        toast({
          title: "Webhook Delivery Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      toast({
        title: "Webhook Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test webhook",
        variant: "destructive",
      });
    }
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
              isUpdating={updateSettings.isPending}
            />

            {/* Company Rules & Policies */}
            <div className="space-y-4">
              <Card className="shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-xl">Company Rules & Policies</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Reuse existing tab section */}
                  {/* We'll mount the dedicated rules editor here for consistency */}
                  {/* ... keep existing code (Company rules editor component) */}
                </CardContent>
              </Card>
            </div>

            {/* Payroll & Timesheet Settings */}
            <Card className="shadow-sm border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  Payroll & Timesheet Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Timesheet Frequency */}
                <FormField
                  control={form.control}
                  name="timesheet_frequency"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Timesheet Frequency</FormLabel>
                      <Select
                        value={(field.value as string) || 'weekly'}
                        onValueChange={(val) => {
                          field.onChange(val);
                        }}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground min-h-11">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">
                        This controls whether timesheets are submitted weekly or every two weeks.
                      </p>
                    </FormItem>
                  )}
                />

                <div className="max-w-sm">
                  <FormLabel className="flex items-center space-x-2 text-foreground">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Start Date</span>
                  </FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !form && "text-muted-foreground"
                        )}
                      >
                        {selectedDate ? format(selectedDate, "PPP")
                          : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Week Ending Day */}
                <div className="max-w-sm">
                  <WeekEndingDaySelector control={form.control} />
                  <p className="text-sm text-muted-foreground mt-3">
                    Select the day of the week when your work week ends for timesheet calculations.
                  </p>
                </div>

                {/* Company Timezone */}
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Company Timezone</FormLabel>
                      <Select
                        value={field.value || 'America/Toronto'}
                        onValueChange={(val) => field.onChange(val)}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground min-h-11">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm text-muted-foreground">
                        All timestamps in Daily Reports, Timesheets, and other modules will be displayed in this timezone.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Show Tax Breakdown */}
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
                          When enabled, employees will see detailed tax calculations (gross pay, estimated tax, and net pay) in their timesheet submissions.
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

                {/* Quote Expiry Reminders */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <FormField
                    control={form.control}
                    name="enable_quote_expiry_reminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start justify-between rounded-lg border border-border p-4 bg-muted/30">
                        <div className="space-y-1 flex-1">
                          <FormLabel className="text-base font-medium">
                            Enable Quote Expiry Reminders
                          </FormLabel>
                          <FormDescription className="text-sm text-muted-foreground">
                            Automatically remind clients when quotes are about to expire.
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
                      name="quote_expiry_reminder_days_before"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days Before Expiry</FormLabel>
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
                            Send reminder this many days before quote expires
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhook Integration */}
            <Card className="shadow-sm border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Webhook className="h-5 w-5 text-primary" />
                  </div>
                  Webhook Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Enable Webhook */}
                <FormField
                  control={form.control}
                  name="webhook_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start justify-between rounded-lg border border-border p-4 bg-muted/30">
                      <div className="space-y-1 flex-1">
                        <FormLabel className="text-base font-medium">
                          Enable Daily Webhook
                        </FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Automatically send daily summary data to your webhook endpoint at 11:59 PM UTC
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

                {/* Webhook URL */}
                <FormField
                  control={form.control}
                  name="webhook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span>Webhook URL</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-domain.com/webhook"
                          {...field}
                          disabled={!form.watch('webhook_enabled')}
                          className="bg-background border-border"
                        />
                      </FormControl>
                      <FormDescription>
                        The endpoint where daily summary data will be sent
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Webhook Secret */}
                <FormField
                  control={form.control}
                  name="webhook_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span>Webhook Secret (Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Your secret key for signature verification"
                          {...field}
                          disabled={!form.watch('webhook_enabled')}
                          className="bg-background border-border"
                        />
                      </FormControl>
                      <FormDescription>
                        Used to generate HMAC-SHA256 signature in the X-Webhook-Signature header
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Test Webhook Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestWebhook}
                  disabled={!form.watch('webhook_url') || !form.watch('webhook_enabled')}
                  className="w-full"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Test Webhook
                </Button>

                {/* Payload Example */}
                <Alert className="bg-muted/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Expected Payload Structure:</strong>
                    <pre className="mt-2 text-xs overflow-x-auto bg-background p-2 rounded">
{`{
  "date": "2025-10-22",
  "company_id": "uuid",
  "summary": {
    "total_timesheets": 10,
    "total_hours": 80,
    "total_jobs": 5,
    "total_employees": 8
  }
}`}
                    </pre>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Usage Information */}
            <UsageInformation />

            {/* Save Button - Fixed at bottom */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-6 -mx-6">
              <div className="max-w-5xl mx-auto">
                <Button
                  type="submit"
                  disabled={updateSettings.isPending}
                  size="lg"
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  {updateSettings.isPending ? (
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
