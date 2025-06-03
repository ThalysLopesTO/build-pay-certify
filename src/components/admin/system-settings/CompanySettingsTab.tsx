
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCompanySettings, type CompanySettings as CompanySettingsType } from '@/hooks/useCompanySettings';
import { Building2, Mail, Phone, MapPin, FileText, Upload, Globe, Share2 } from 'lucide-react';

export const CompanySettingsTab = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  
  const form = useForm<Partial<CompanySettingsType & { website?: string; social_media?: string }>>({
    defaultValues: {
      company_name: settings?.company_name || '',
      company_address: settings?.company_address || '',
      company_phone: settings?.company_phone || '',
      company_email: settings?.company_email || '',
      hst_number: settings?.hst_number || '',
      company_logo_url: settings?.company_logo_url || '',
      website: '',
      social_media: '',
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
        company_logo_url: settings.company_logo_url || '',
        website: '',
        social_media: '',
      });
    }
  }, [settings, form]);

  const onSubmit = (data: Partial<CompanySettingsType>) => {
    // Filter out the extra fields that aren't in the database
    const { website, social_media, ...companyData } = data as any;
    updateSettings(companyData);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Company Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Company Name *</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your company name" {...field} />
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
                      <FormLabel className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>Phone Number *</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="company_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Address *</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your complete business address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Company Email *</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="company@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hst_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>HST Number</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your HST or tax registration number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="company_logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Company Logo URL</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Website (Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_media"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Share2 className="h-4 w-4" />
                        <span>Social Media Links (Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="LinkedIn, Facebook, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Usage Information</h4>
                <p className="text-sm text-blue-700">
                  These settings automatically appear in invoice PDFs, outgoing emails, and dashboard header branding. 
                  Fields marked with * are required for generating professional invoices.
                </p>
              </div>

              <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? 'Saving...' : 'Save Company Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
