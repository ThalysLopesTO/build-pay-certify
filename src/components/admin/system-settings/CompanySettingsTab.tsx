
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCompanySettings, type CompanySettings as CompanySettingsType } from '@/hooks/useCompanySettings';
import CompanyBrandingSection from '../CompanyBrandingSection';
import { Building2, Mail, Phone, MapPin, FileText, Globe, Share2, Calendar } from 'lucide-react';

const WEEK_ENDING_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

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
      {/* Company Branding Section */}
      <CompanyBrandingSection />
      
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <FormField
                  control={form.control}
                  name="week_ending_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Week Ending Day</span>
                      </FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select week ending day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WEEK_ENDING_DAYS.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="company_rules_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Rules & Policies</FormLabel>
                    <FormControl>
                      <Textarea rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Usage Information</h4>
                <p className="text-sm text-blue-700">
                  These settings automatically appear in invoice PDFs, outgoing emails, and dashboard header branding. 
                  Fields marked with * are required for generating professional invoices. The week ending day determines 
                  when your company's work week ends for timesheet submissions.
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
