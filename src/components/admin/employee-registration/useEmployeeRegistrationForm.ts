
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
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      address: '',
      phoneNumber: '',
      role: 'employee',
      trade: '',
      hourlyRate: 0,
      photo: undefined,
      certificates: [],
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
      console.log('Submitting employee registration:', { email: data.email, username: data.username, role: data.role });

      let photoUrl: string | null = null;
      const certificateUrls: Array<{ name: string; expiryDate?: string; noExpiry: boolean; fileUrl?: string }> = [];

      // Upload photo if provided
      if (data.photo) {
        console.log('Uploading employee photo...');
        const fileExtension = data.photo.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, data.photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          throw new Error('Failed to upload employee photo');
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
        console.log('Photo uploaded successfully:', photoUrl);
      }

      // Upload certificate files if provided
      for (const certificate of data.certificates) {
        const certData: any = {
          name: certificate.name,
          expiryDate: certificate.noExpiry ? undefined : certificate.expiryDate?.toISOString(),
          noExpiry: certificate.noExpiry,
        };

        if (certificate.file) {
          console.log('Uploading certificate file:', certificate.name);
          const fileExtension = certificate.file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExtension}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(fileName, certificate.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Certificate upload error:', uploadError);
            throw new Error(`Failed to upload certificate file for ${certificate.name}`);
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(fileName);
          
          certData.fileUrl = publicUrlData.publicUrl;
          console.log('Certificate file uploaded successfully:', certData.fileUrl);
        }

        certificateUrls.push(certData);
      }

      // Call the Edge Function to create the employee
      const { data: result, error } = await supabase.functions.invoke('create-employee', {
        body: {
          employeeData: {
            companyId: user.companyId,
            email: data.email,
            username: data.username,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            address: data.address,
            phoneNumber: data.phoneNumber,
            role: data.role,
            trade: data.trade,
            hourlyRate: data.hourlyRate,
            photoUrl: photoUrl,
            certificates: certificateUrls,
          }
        },
      });

      // Check if there was a network/connection error
      if (error) {
        console.error('Edge Function connection error:', error);
        throw new Error(`Failed to connect to employee registration service: ${error.message}`);
      }

      // Check if the result contains an error (from the edge function)
      if (result && !result.success) {
        console.error('Employee registration error from edge function:', result.error);
        throw new Error(result.error || 'Employee registration failed');
      }

      // Check if the operation was successful
      if (!result || !result.success) {
        console.error('Employee registration failed - no success response:', result);
        throw new Error('Employee registration failed - please try again');
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
