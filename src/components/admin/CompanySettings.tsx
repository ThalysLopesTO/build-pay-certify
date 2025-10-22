/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCompanySettings, useUpdateSettingsMutation, type CompanySettings } from '@/hooks/useCompanySettings';
import CompanyBrandingSection from './CompanyBrandingSection';
import { Building2, Mail, Phone, MapPin, FileText, Calendar, Webhook, Key, Link2, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';

const CompanySettings = () => {
  const { settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateSettingsMutation();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<Partial<CompanySettings>>({
    defaultValues: {
      company_name: settings?.company_name || '',
      company_address: settings?.company_address || '',
      company_phone: settings?.company_phone || '',
      company_email: settings?.company_email || '',
      hst_number: settings?.hst_number || '',
      tax_percentage: settings?.tax_percentage || 13,
      timesheet_frequency: (settings as any)?.timesheet_frequency || 'weekly',
      webhook_url: settings?.webhook_url || '',
      webhook_secret: settings?.webhook_secret || '',
      webhook_enabled: settings?.webhook_enabled || false,
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name,
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        hst_number: settings.hst_number || '',
        tax_percentage: settings.tax_percentage || 13,
        timesheet_frequency: (settings as any)?.timesheet_frequency || 'weekly',
        webhook_url: settings.webhook_url || '',
        webhook_secret: settings.webhook_secret || '',
        webhook_enabled: settings.webhook_enabled || false,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: Partial<CompanySettings>) => {
    updateSettings.mutate(data);
  };

  const handleTestWebhook = async () => {
    try {
      const webhookUrl = form.getValues('webhook_url');
      const webhookEnabled = form.getValues('webhook_enabled');

      if (!webhookEnabled || !webhookUrl) {
        toast({
          title: "Webhook Test Failed",
          description: "Please enable webhooks and configure a URL first",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-daily-webhook', {
        body: {
          company_id: user?.companyId,
          date: format(new Date(), 'yyyy-MM-dd'),
        },
      });

      if (error) {
        toast({
          title: "Webhook Test Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Webhook Test Successful",
          description: "Check your endpoint for the test payload",
        });
      }
    } catch (error: any) {
      toast({
        title: "Webhook Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-foreground">Loading company settings...</p>
        </div>
      </div>
    );
  }

  console.log("Error", form.formState.errors)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Company Branding Section */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Company Branding</span>
          </CardTitle>
          <div className="h-px bg-border mt-4"></div>
        </CardHeader>
        <CardContent className="pt-2">
          <CompanyBrandingSection />
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Company Information</span>
              </CardTitle>
              <div className="h-px bg-border mt-4"></div>
            </CardHeader>
            <CardContent className="pt-2">

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-foreground">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Company Name <span className="text-red-500">*</span></span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your company name"
                        className="bg-background border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Company Address <span className="text-red-500">*</span></span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your complete business address"
                        className="bg-background border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2 text-foreground">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>Company Email <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="company@example.com"
                          className="bg-background border-border text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2 text-foreground">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>Company Phone <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(555) 123-4567"
                          className="bg-background border-border text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hst_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>HST/Tax Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your HST or tax registration number"
                        className="bg-background border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Tax Percentage (%) <span className="text-red-500">*</span></span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="13.00"
                        className="bg-background border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      Tax percentage applied to timesheet submissions (default: 13% HST)
                    </p>
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Invoice Requirements</h4>
                <p className="text-sm text-blue-700">
                  Fields marked with <span className="text-red-500">*</span> are required for generating and sending professional invoices.
                  Complete all required fields to enable invoice email functionality.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payroll & Timesheet Settings */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Payroll & Timesheet Settings</span>
              </CardTitle>
              <CardDescription className="mt-1">
                This controls whether timesheets are submitted weekly or every two weeks.
              </CardDescription>
              <div className="h-px bg-border mt-4"></div>
            </CardHeader>
            <CardContent className="pt-2">
              <Form {...form}>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <FormField
                    control={form.control}
                    name="timesheet_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2 text-foreground">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Timesheet Frequency</span>
                        </FormLabel>
                        <Select
                          value={(field.value as string) || 'weekly'}
                          onValueChange={(val) => field.onChange(val)}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground min-h-11">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground mt-1">
                          This setting controls whether timesheets are submitted weekly or every two weeks.
                        </p>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Webhook Integration */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Webhook className="h-5 w-5 text-primary" />
                <span>Webhook Integration</span>
              </CardTitle>
              <CardDescription className="mt-1">
                Configure webhooks to send daily punch summaries to external automation systems like n8n, Zapier, or Make.
              </CardDescription>
              <div className="h-px bg-border mt-4"></div>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              
              {/* Webhook Enabled Toggle */}
              <FormField
                control={form.control}
                name="webhook_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Enable Webhooks</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically send daily punch summaries to your webhook endpoint
                      </p>
                    </div>
                    <FormControl>
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
                        type="url"
                        placeholder="https://your-n8n-instance.com/webhook/daily-summary"
                        className="bg-background border-border text-foreground font-mono text-sm"
                        disabled={!form.watch('webhook_enabled')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      The endpoint URL where daily summaries will be sent via POST request
                    </p>
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
                        placeholder="Enter a secret key for signature verification"
                        className="bg-background border-border text-foreground font-mono text-sm"
                        disabled={!form.watch('webhook_enabled')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Used to generate HMAC-SHA256 signatures for request verification
                    </p>
                  </FormItem>
                )}
              />

              {/* Test Webhook Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleTestWebhook}
                disabled={!form.watch('webhook_enabled') || !form.watch('webhook_url')}
                className="w-full"
              >
                <Webhook className="h-4 w-4 mr-2" />
                Test Webhook
              </Button>

              {/* Information Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Webhook Payload Structure:</strong>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "company_id": "uuid",
  "date": "2025-10-22",
  "generatedAt": "2025-10-22T23:59:00Z",
  "totals": {
    "employees": 15,
    "punchRecords": 45,
    "hours": 360.5
  },
  "employees": [
    {
      "name": "John Doe",
      "hours": 8.5,
      "jobsite": "Main Site"
    }
  ],
  "jobsites": [
    {
      "jobsiteName": "Main Site",
      "hours": 120.5
    }
  ]
}`}
                  </pre>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Fixed Save Button */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
            <div className="max-w-4xl mx-auto p-4">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateSettings.isPending}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {updateSettings.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
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
  );
};

export default CompanySettings;
