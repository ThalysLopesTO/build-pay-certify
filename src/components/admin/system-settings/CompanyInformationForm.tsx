
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, Mail, Phone, MapPin, FileText, Globe, Share2 } from 'lucide-react';
import { CompanySettings } from '@/hooks/useCompanySettings';

interface CompanyInformationFormProps {
  form: UseFormReturn<Partial<CompanySettings & { website?: string; social_media?: string }>>;
  onSubmit: (data: Partial<CompanySettings>) => void;
  isUpdating: boolean;
}

export const CompanyInformationForm: React.FC<CompanyInformationFormProps> = ({
  form,
  onSubmit,
  isUpdating
}) => {
  const handleSubmit = (data: Partial<CompanySettings & { website?: string; social_media?: string }>) => {
    // Filter out the extra fields that aren't in the database
    const { website, social_media, ...companyData } = data;
    onSubmit(companyData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Company Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

            <Button type="submit" disabled={isUpdating} className="w-full">
              {isUpdating ? 'Saving...' : 'Save Company Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
