
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
      <Card className="shadow-sm border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Company Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your company name" 
                        className="h-11"
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
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(555) 123-4567" 
                        className="h-11"
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
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Business Address <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your complete business address" 
                      className="h-11"
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
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Company Email <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="company@example.com" 
                        className="h-11"
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
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      HST/Tax Number
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your HST or tax registration number" 
                        className="h-11"
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
      <Card className="shadow-sm border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Company Rules & Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <FormField
            control={form.control}
            name="company_rules_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Rules & Policies Content</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={12} 
                    placeholder="Enter your company rules, safety policies, and guidelines here. This content will be visible to all employees."
                    className="resize-none"
                    {...field} 
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-2">
                  These rules will be displayed to all employees and can include safety guidelines, work policies, and other important information.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
