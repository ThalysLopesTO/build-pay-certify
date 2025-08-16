
import { useState, useRef, useEffect } from 'react';
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
  const [loadingStep, setLoadingStep] = useState<string>('');
  const { user } = useAuth();
  const { data: employeeLimit } = useEmployeeLimit();
  const { createEmployee, refreshEmployees } = useEmployees();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function to reset loading state and clear timeouts
  const resetLoadingState = () => {
    setLoading(false);
    setLoadingStep('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      resetLoadingState();
    };
  }, []);

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
      position: '',
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

    // Reset any previous states
    resetLoadingState();
    
    setLoading(true);
    setLoadingStep('Preparing registration...');
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Set timeout for the entire operation (60 seconds)
    timeoutRef.current = setTimeout(() => {
      resetLoadingState();
      toast({
        title: "Registration Timeout",
        description: "The registration process is taking too long. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }, 60000);
    
    try {
      console.log('Submitting employee registration:', { 
        email: data.email, 
        role: data.role, 
        hourlyRate: data.hourlyRate, 
        hasPhoto: !!data.photo 
      });

      let photoUrl: string | null = null;
      const certificateUrls: Array<{ name: string; expiryDate?: string; noExpiry: boolean; fileUrl?: string }> = [];

      // Upload photo if provided
      if (data.photo) {
        setLoadingStep('Uploading employee photo...');
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
      if (data.certificates.length > 0) {
        setLoadingStep('Uploading certificate files...');
      }
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
      setLoadingStep('Creating employee account...');
      console.log('Calling create-employee edge function...');
      
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
            position: data.position,
            hourlyRate: data.hourlyRate,
            workerType: data.workerType,
            photoUrl: photoUrl,
            certificates: certificateUrls,
          }
        },
      });
      
      console.log('Edge function response:', { result, error });

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

      // Fetch the actual employee profile and add to context
      if (result.user) {
        setLoadingStep('Finalizing employee setup...');
        // Add a small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: employeeProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', result.user.id)
          .maybeSingle();

        if (!fetchError && employeeProfile) {
          console.log('Successfully fetched employee profile:', employeeProfile);
          // Add the real employee data to context
          await createEmployee(employeeProfile);
        } else {
          console.error('Error fetching employee profile:', fetchError);
          // Refresh the employee list as fallback
          await refreshEmployees();
        }
      }

      toast({
        title: "Employee Registered Successfully",
        description: `${data.firstName} ${data.lastName} has been added to the system. They will be required to change their password on first login.`,
      });

      // Reset form
      form.reset();
      
    } catch (error: any) {
      console.error('Employee registration error:', error);
      
      // More specific error messages based on the loading step
      let errorDescription = "Failed to register employee";
      if (loadingStep.includes('photo')) {
        errorDescription = "Failed to upload employee photo. Please check the file size and format.";
      } else if (loadingStep.includes('certificate')) {
        errorDescription = "Failed to upload certificate files. Please check the file sizes and formats.";
      } else if (loadingStep.includes('account')) {
        errorDescription = "Failed to create employee account. Please verify the email is not already in use.";
      }
      
      toast({
        title: "Registration Failed",
        description: error.message || errorDescription,
        variant: "destructive",
      });
    } finally {
      resetLoadingState();
    }
  };

  return {
    form,
    loading,
    loadingStep,
    handleSubmit,
    cancelRegistration: resetLoadingState,
  };
};
