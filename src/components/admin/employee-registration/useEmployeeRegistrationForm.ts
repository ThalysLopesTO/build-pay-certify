
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
import { employeeSchema, EmployeeFormData } from './schemas';

export const useEmployeeRegistrationForm = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { data: employeeLimit } = useEmployeeLimit();

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
    // Check employee limit before submission
    if (!employeeLimit?.canAddEmployee) {
      toast({
        title: "Employee Limit Reached",
        description: `You have reached your plan's employee limit of ${employeeLimit?.employeeLimit} employees. Please upgrade your plan to add more employees.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting employee registration:', { email: data.email, role: data.role });

      // Call the Edge Function to create the employee
      const { data: result, error } = await supabase.functions.invoke('create-employee', {
        body: {
          employeeData: {
            companyId: user.companyId,
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            address: data.address,
            phoneNumber: data.phoneNumber,
            role: data.role,
            trade: data.trade,
            hourlyRate: data.hourlyRate,
            // Certificate expiry dates as ISO strings
            workAtHeightsExpiry: data.workAtHeightsExpiry?.toISOString(),
            whmisExpiry: data.whmisExpiry?.toISOString(),
            fourStepsExpiry: data.fourStepsExpiry?.toISOString(),
            fiveStepsExpiry: data.fiveStepsExpiry?.toISOString(),
            liftOperatorExpiry: data.liftOperatorExpiry?.toISOString(),
          }
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (result?.error) 
      {
      throw new Error(result.error);
      }

      console.log('Employee registered successfully:', result);

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

  return {
    form,
    loading,
    handleSubmit,
  };
};
