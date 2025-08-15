
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
import { useEmployees } from '@/contexts/EmployeeContext';
import { employeeSchema, EmployeeFormData } from './schemas';

export const useEmployeeRegistrationForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: employeeLimit } = useEmployeeLimit();
  const { createEmployee } = useEmployees();

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

  const readableSupabaseError = (error: any): string => {
    if (!error) return 'Unknown error occurred';
    
    // Handle specific Supabase errors
    if (error.message?.includes('duplicate key value violates unique constraint')) {
      return 'A user with this email already exists. Please use a different email address.';
    }
    
    if (error.message?.includes('new row violates row-level security policy')) {
      return 'You do not have permission to perform this action. Please contact your administrator.';
    }
    
    if (error.message?.includes('Failed to upload')) {
      return 'File upload failed. Please check your file and try again.';
    }
    
    if (error.message?.includes('Employee limit reached')) {
      return 'Employee limit reached. Please upgrade your plan to add more employees.';
    }
    
    return error.message || 'An unexpected error occurred';
  };

  const handleSubmit = async (data: EmployeeFormData) => {
    // Clear any previous errors
    setError(null);
    
    // Check employee limit before submission
    if (!employeeLimit?.canAddEmployee) {
      const errorMsg = `You have reached your plan's employee limit of ${employeeLimit?.employeeLimit} employees. Please upgrade your plan to add more employees.`;
      setError(errorMsg);
      toast({
        title: "Employee Limit Reached",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Ensure we have company information
    if (!user?.companyId) {
      const errorMsg = "Company information is not available. Please refresh the page and try again.";
      setError(errorMsg);
      toast({
        title: "Missing Company Information",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let uploadedPhotoPath: string | null = null;
    let uploadedCertPaths: string[] = [];
    
    try {
      console.log('Starting employee registration:', { 
        email: data.email, 
        role: data.role, 
        hourlyRate: data.hourlyRate, 
        hasPhoto: !!data.photo,
        companyId: user.companyId
      });

      let photoUrl: string | null = null;
      const certificateUrls: Array<{ name: string; expiryDate?: string; noExpiry: boolean; fileUrl?: string }> = [];

      // Upload photo if provided
      if (data.photo) {
        console.log('Uploading employee photo...');
        const fileExtension = data.photo.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        uploadedPhotoPath = fileName;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, data.photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          throw new Error('Failed to upload employee photo. Please try a different image.');
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
          uploadedCertPaths.push(fileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(fileName, certificate.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Certificate upload error:', uploadError);
            throw new Error(`Failed to upload certificate file for ${certificate.name}. Please try a different file.`);
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
      console.log('Calling create-employee edge function...');
      const { data: result, error: functionError } = await supabase.functions.invoke('create-employee', {
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
            workerType: data.workerType,
            photoUrl: photoUrl,
            certificates: certificateUrls,
          }
        },
      });

      // Check for network/connection error first
      if (functionError) {
        console.error('Edge Function connection error:', functionError);
        throw new Error(`Connection error: ${functionError.message}`);
      }

      // Check if the result exists and is structured properly
      if (!result) {
        console.error('No response from edge function');
        throw new Error('No response received from server. Please try again.');
      }

      // Check if the result contains an error (from the edge function)
      if (result.success === false) {
        console.error('Employee registration error from edge function:', result.error);
        throw new Error(result.error || 'Employee registration failed');
      }

      // Check if the operation was successful
      if (!result.success) {
        console.error('Employee registration failed - no success response:', result);
        throw new Error('Employee registration failed - please try again');
      }

      console.log('Employee registered successfully:', result);

      // Refresh the employee context to get the new employee
      await createEmployee({
        user_id: result.user.id,
        company_id: user.companyId,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        trade: data.trade || 'General',
        position: 'Worker',
        hourly_rate: data.hourlyRate,
        photo_url: photoUrl,
        worker_type: data.workerType,
        phone: data.phoneNumber,
        is_active: true,
      });

      // Show success message
      toast({
        title: "Employee Registered Successfully",
        description: `${data.firstName} ${data.lastName} has been added to the system. They will receive login credentials via email.`,
      });

      // Reset form on success
      form.reset();
      
    } catch (error: any) {
      console.error('Employee registration error:', error);
      
      // Cleanup uploaded files on error
      if (uploadedPhotoPath) {
        try {
          await supabase.storage.from('employee-photos').remove([uploadedPhotoPath]);
        } catch (cleanupError) {
          console.error('Failed to cleanup photo:', cleanupError);
        }
      }
      
      if (uploadedCertPaths.length > 0) {
        try {
          await supabase.storage.from('certificates').remove(uploadedCertPaths);
        } catch (cleanupError) {
          console.error('Failed to cleanup certificates:', cleanupError);
        }
      }
      
      // Show user-friendly error message
      const errorMessage = readableSupabaseError(error);
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Always stop loading, regardless of success or failure
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    handleSubmit,
  };
};
