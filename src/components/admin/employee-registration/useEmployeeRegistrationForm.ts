
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
import { employeeSchema, EmployeeFormData } from './schemas';

export const useEmployeeRegistrationForm = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { data: employeeLimit } = useEmployeeLimit();
  const queryClient = useQueryClient();

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
      workerType: 'subcontractor',
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
      console.log('Submitting employee registration:', { 
        email: data.email, 
        role: data.role, 
        hourlyRate: data.hourlyRate, 
        workerType: data.workerType,
        hasPhoto: !!data.photo 
      });

      // First create the auth user using edge function (requires admin privileges)
      const { data: authResult, error: authError } = await supabase.functions.invoke('create-employee', {
        body: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          companyId: user.companyId
        },
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authResult?.success || !authResult?.user?.id) {
        console.error('Auth user creation failed:', authResult);
        throw new Error(authResult?.error || 'Failed to create user account');
      }

      const userId = authResult.user.id;
      console.log('Auth user created successfully:', userId);

      // Upload photo if provided
      let photoUrl: string | null = null;
      if (data.photo) {
        console.log('Uploading employee photo...');
        const fileExtension = data.photo.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
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

      // Set default tax rates for payroll employees
      const defaultRates = data.workerType === 'employee' ? {
        income_tax_rate: 12.00,
        cpp_rate: 5.95,
        ei_rate: 1.63
      } : {};

      // Insert user profile directly into database
      const profileData = {
        user_id: userId,
        company_id: user.companyId,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        trade: data.trade && data.trade.trim() !== '' ? data.trade : 'General',
        position: 'Worker',
        hourly_rate: data.hourlyRate > 0 ? data.hourlyRate : null,
        photo_url: photoUrl,
        phone: data.phoneNumber && data.phoneNumber.trim() !== '' ? data.phoneNumber : null,
        pending_approval: false,
        worker_type: data.workerType,
        is_active: true,
        ...defaultRates
      };

      console.log('Inserting user profile:', profileData);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('User profile created successfully');

      // Create certificates if provided
      if (data.certificates && data.certificates.length > 0) {
        console.log('Creating certificates for employee:', userId);
        
        for (const certificate of data.certificates) {
          let certificateFileUrl: string | null = null;

          // Upload certificate file if provided
          if (certificate.file) {
            console.log('Uploading certificate file:', certificate.name);
            const fileExtension = certificate.file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExtension}`;
            
            const { error: uploadError } = await supabase.storage
              .from('certificates')
              .upload(fileName, certificate.file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Certificate upload error:', uploadError);
              // Don't fail the entire process for certificate upload errors
              continue;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('certificates')
              .getPublicUrl(fileName);
            
            certificateFileUrl = publicUrlData.publicUrl;
            console.log('Certificate file uploaded successfully:', certificateFileUrl);
          }

          // Insert certificate record
          const certificateData = {
            employee_id: userId,
            company_id: user.companyId,
            certificate_name: certificate.name,
            certificate_type: certificate.noExpiry ? 'no-expiry' : 'custom',
            expiry_date: certificate.noExpiry 
              ? new Date('2099-12-31').toISOString().split('T')[0]
              : certificate.expiryDate?.toISOString().split('T')[0],
            file_url: certificateFileUrl,
            uploaded_by: user.id,
            status: 'valid'
          };

          const { error: certError } = await supabase
            .from('employee_certificates')
            .insert(certificateData);

          if (certError) {
            console.error('Error creating certificate:', certError);
            // Don't fail the entire process for certificate errors, just log
          } else {
            console.log('Certificate created successfully:', certificate.name);
          }
        }
      }

      // Invalidate and refetch employee-related queries to refresh the UI
      await queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
      await queryClient.invalidateQueries({ queryKey: ['employee-limit'] });

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
