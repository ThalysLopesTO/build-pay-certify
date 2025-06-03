
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Save, User, Shield, Phone, MapPin } from 'lucide-react';
import DatePickerField from '../foreman/DatePickerField';

const employeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['admin', 'foreman', 'payroll', 'employee']),
  trade: z.string().min(1, 'Trade is required'),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  // Certificate expiry dates
  workAtHeightsExpiry: z.date().optional(),
  whmisExpiry: z.date().optional(),
  fourStepsExpiry: z.date().optional(),
  fiveStepsExpiry: z.date().optional(),
  liftOperatorExpiry: z.date().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const EmployeeRegistration = () => {
  const [loading, setLoading] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      address: '',
      phoneNumber: '',
      role: 'employee',
      trade: '',
      hourlyRate: 0,
      workAtHeightsExpiry: undefined,
      whmisExpiry: undefined,
      fourStepsExpiry: undefined,
      fiveStepsExpiry: undefined,
      liftOperatorExpiry: undefined,
    },
  });

  const handleSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    
    try {
      // Create the user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          address: data.address,
          phone_number: data.phoneNumber,
          role: data.role,
          trade: data.trade,
          hourly_rate: data.hourlyRate,
          // Certificate expiry dates
          work_at_heights_expiry: data.workAtHeightsExpiry?.toISOString(),
          whmis_expiry: data.whmisExpiry?.toISOString(),
          four_steps_expiry: data.fourStepsExpiry?.toISOString(),
          five_steps_expiry: data.fiveStepsExpiry?.toISOString(),
          lift_operator_expiry: data.liftOperatorExpiry?.toISOString(),
          must_change_password: true, // Force password change on first login
        },
      });

      if (authError) {
        throw authError;
      }

      toast({
        title: "Employee Registered Successfully",
        description: `${data.firstName} ${data.lastName} has been added to the system. They will be required to change their password on first login.`,
      });

      // Reset form
      form.reset();
      
    } catch (error: any) {
      console.error('Employee registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <UserPlus className="h-6 w-6 text-orange-600" />
        <div>
          <h2 className="text-2xl font-bold">Employee Registration</h2>
          <p className="text-slate-600">Register new employees and set their permissions and certificates</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Add New Employee</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Personal & Work Details Section */}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <SelectItem value="payroll">Payroll</SelectItem>
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

              {/* Login Credentials Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b pb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <h3 className="text-lg font-semibold">Login Credentials</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Set initial password" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-slate-500 mt-1">
                        Employee will be required to change this password on first login
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              {/* Certificates Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b pb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <h3 className="text-lg font-semibold">Certificates</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="workAtHeightsExpiry"
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="Work at Heights Expiry"
                        placeholder="Select expiry date"
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whmisExpiry"
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="WHMIS Expiry"
                        placeholder="Select expiry date"
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fourStepsExpiry"
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="4 Steps Expiry"
                        placeholder="Select expiry date"
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fiveStepsExpiry"
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="5 Steps Expiry"
                        placeholder="Select expiry date"
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="liftOperatorExpiry"
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        label="Lift Operator Expiry"
                        placeholder="Select expiry date"
                      />
                    )}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Certificate expiry alerts will be triggered 30 days before any certificate expires.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => form.reset()}
                >
                  Reset Form
                </Button>
                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? (
                    'Registering...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Register Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeRegistration;
