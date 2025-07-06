
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { CompanySettings } from '@/hooks/useCompanySettings';

interface CompanyInformationFormProps {
  form: UseFormReturn<Partial<CompanySettings>>;
  onSubmit: (data: Partial<CompanySettings>) => void;
  isUpdating: boolean;
}

export const CompanyInformationForm: React.FC<CompanyInformationFormProps> = ({
  form,
  onSubmit,
  isUpdating
}) => {
  const handleSubmit = (data: Partial<CompanySettings>) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-8">
      {/* Company Information Section */}
      <Card className="border-border dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-foreground dark:text-white">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Company Information</span>
          </CardTitle>
          <div className="h-px bg-border dark:bg-gray-700 mt-4"></div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="company_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>Phone Number <span className="text-red-500">*</span></span>
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
              name="company_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Address <span className="text-red-500">*</span></span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="hst_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 text-foreground dark:text-white">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>HST Number</span>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Rules & Policies Section */}
      <Card className="border-border dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-foreground dark:text-white">
            <FileText className="h-5 w-5 text-primary" />
            <span>Company Rules & Policies</span>
          </CardTitle>
          <div className="h-px bg-border dark:bg-gray-700 mt-4"></div>
        </CardHeader>
        <CardContent className="pt-2">
          <FormField
            control={form.control}
            name="company_rules_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground dark:text-white">Rules & Policies Content</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={10} 
                    placeholder="Enter your company rules and policies here..."
                    className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-white"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
