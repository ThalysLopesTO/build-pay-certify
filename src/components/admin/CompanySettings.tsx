
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCompanySettings, type CompanySettings } from '@/hooks/useCompanySettings';
import CompanyBrandingSection from './CompanyBrandingSection';
import { Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';

const CompanySettings = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  
  const form = useForm<Partial<CompanySettings>>({
    defaultValues: {
      company_name: settings?.company_name || '',
      company_address: settings?.company_address || '',
      company_phone: settings?.company_phone || '',
      company_email: settings?.company_email || '',
      hst_number: settings?.hst_number || '',
      tax_percentage: settings?.tax_percentage || 13,
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
      });
    }
  }, [settings, form]);

  const onSubmit = (data: Partial<CompanySettings>) => {
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
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
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

      {/* Company Information */}
      <Card className="border-border dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-foreground dark:text-white">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Company Information</span>
          </CardTitle>
          <div className="h-px bg-border dark:bg-gray-700 mt-4"></div>
        </CardHeader>
        <CardContent className="pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Company Name <span className="text-red-500">*</span></span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your company name" 
                        className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-white"
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
                    <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Company Address <span className="text-red-500">*</span></span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your complete business address" 
                        className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-white"
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
                      <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>Company Email <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="company@example.com" 
                          className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-white"
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
                      <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>Company Phone <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(555) 123-4567" 
                          className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-white"
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
                      <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>HST/Tax Number</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your HST or tax registration number" 
                          className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-white"
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
                      <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
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
                          className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-white"
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

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Invoice Requirements</h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Fields marked with <span className="text-red-500">*</span> are required for generating and sending professional invoices. 
                  Complete all required fields to enable invoice email functionality.
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border dark:border-gray-700">
        <div className="max-w-4xl mx-auto p-4">
          <Button 
            onClick={form.handleSubmit(onSubmit)}
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
      </div>
    </div>
  );
};

export default CompanySettings;
