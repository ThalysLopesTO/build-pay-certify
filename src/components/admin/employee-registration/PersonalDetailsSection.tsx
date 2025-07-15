
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { User, Phone, MapPin } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeFormData } from './schemas';
import PhotoUploadField from './PhotoUploadField';

interface PersonalDetailsSectionProps {
  form: UseFormReturn<EmployeeFormData>;
  formatCurrency: (value: number) => string;
}

const PersonalDetailsSection: React.FC<PersonalDetailsSectionProps> = ({ form, formatCurrency }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b pb-2">
        <User className="h-4 w-4 text-blue-600" />
        <h3 className="text-lg font-semibold">Personal & Work Details</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input placeholder="Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Photo Upload */}
      <PhotoUploadField form={form} />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="john.smith@company.com" {...field} />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-slate-500 mt-1">
              Used for admin communication only (not for login)
            </p>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Address</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, City, Province" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>Phone Number</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="workerType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Worker Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="subcontractor">Subcontractor (self-employed)</SelectItem>
                  <SelectItem value="employee">Employee (on company payroll)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="foreman">Foreman</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trade *</FormLabel>
              <FormControl>
                <Input placeholder="Electrical, Plumbing, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate *</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                  <Input 
                    type="number" 
                    placeholder="25.00" 
                    step="0.01"
                    className="pl-8"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {field.value > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {formatCurrency(field.value)} per hour
                </p>
              )}
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PersonalDetailsSection;
