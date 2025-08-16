import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { User, Phone, MapPin, Mail, DollarSign, Briefcase, Shield, Lock } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmployeeFormData } from './schemas';
import PhotoUploadField from './PhotoUploadField';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface ImprovedPersonalDetailsSectionProps {
  form: UseFormReturn<EmployeeFormData>;
  formatCurrency: (value: number) => string;
}

const ImprovedPersonalDetailsSection: React.FC<ImprovedPersonalDetailsSectionProps> = ({ form, formatCurrency }) => {
  const { user } = useAuth();

  // Filter available roles based on current user's role
  const getAvailableRoles = () => {
    if (!user?.role) return [];
    
    switch (user.role) {
      case 'foreman':
        return ['employee'];
      case 'management':
        return ['employee', 'foreman'];
      case 'admin':
      case 'super_admin':
        return ['employee', 'foreman', 'management', 'admin'];
      default:
        return [];
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <User className="h-5 w-5 text-blue-600" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John" className="h-10" {...field} />
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
                  <FormLabel className="text-sm font-medium">Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Smith" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Photo Upload - Full Width */}
          <div className="pt-2">
            <PhotoUploadField form={form} />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Mail className="h-5 w-5 text-green-600" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center space-x-2">
                  <span>Email Address *</span>
                  <Badge variant="secondary" className="text-xs">Login Credential</Badge>
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.smith@company.com" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground mt-1">
                  Employee will use this email to access their dashboard
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Temporary Password *</span>
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Set initial password" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground mt-1">
                  Employee will be required to change this password on first login
                </p>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, Province" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Details Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Briefcase className="h-5 w-5 text-orange-600" />
            <span>Work Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="workerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Worker Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="subcontractor">
                        <div className="flex flex-col">
                          <span>Subcontractor</span>
                          <span className="text-xs text-muted-foreground">Self-employed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="employee">
                        <div className="flex flex-col">
                          <span>Employee</span>
                          <span className="text-xs text-muted-foreground">Company payroll</span>
                        </div>
                      </SelectItem>
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
                  <FormLabel className="text-sm font-medium">Role *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.includes('employee') && (
                        <SelectItem value="employee">Employee</SelectItem>
                      )}
                      {availableRoles.includes('foreman') && (
                        <SelectItem value="foreman">Foreman</SelectItem>
                      )}
                      {availableRoles.includes('management') && (
                        <SelectItem value="management">Management</SelectItem>
                      )}
                      {availableRoles.includes('admin') && (
                        <SelectItem value="admin">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-3 w-3" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      )}
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
                  <FormLabel className="text-sm font-medium">Trade/Skill *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Electrical, Plumbing" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Position *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Site Supervisor, Lead Technician" className="h-10" {...field} />
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
                  <FormLabel className="text-sm font-medium flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Hourly Rate *</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        placeholder="25.00" 
                        step="0.01"
                        className="pl-8 h-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  {field.value > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(field.value)} per hour
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedPersonalDetailsSection;