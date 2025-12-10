
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
// import { useEmployees } from '@/contexts/EmployeeContext';
import { employeeSchema, EmployeeFormData } from './schemas';
import { useQueryClient } from '@tanstack/react-query';

export const useEmployeeRegistrationForm = () => {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const { user } = useAuth();
  const { data: employeeLimit } = useEmployeeLimit();
  // const { createEmployee, refreshEmployees } = useEmployees();
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Cleanup function to reset loading state and abort any ongoing requests
  const resetLoadingState = () => {
    setLoading(false);
    setLoadingStep('');
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
      dateOfBirth: null,
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

    console.log('🚀 Starting employee registration process...');
    console.log('📊 Employee data:', { 
      email: data.email, 
      role: data.role, 
      companyId: user?.companyId,
      hasPhoto: !!data.photo,
      hasCertificates: data.certificates.length > 0
    });

    // Reset any previous states
    resetLoadingState();
    
    setLoading(true);
    setLoadingStep('Preparing registration...');
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
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
        console.log('📸 Uploading employee photo...', { 
          fileName: data.photo.name, 
          fileSize: data.photo.size,
          fileType: data.photo.type 
        });
        
        try {
          const fileExtension = data.photo.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExtension}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('employee-photos')
            .upload(fileName, data.photo, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('❌ Photo upload error:', uploadError);
            
            // Provide fallback option for photo upload failures
            const shouldContinue = confirm(
              'Failed to upload employee photo. Would you like to continue creating the employee without a photo? You can add the photo later.'
            );
            
            if (!shouldContinue) {
              throw new Error('Photo upload failed and user chose not to continue');
            }
            
            console.log('⚠️ Continuing without photo after user confirmation');
            photoUrl = null;
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('employee-photos')
              .getPublicUrl(fileName);
            
            photoUrl = publicUrlData.publicUrl;
            console.log('✅ Photo uploaded successfully:', photoUrl);
          }
        } catch (photoError) {
          console.error('❌ Critical photo upload error:', photoError);
          throw photoError;
        }
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
      console.log('🔧 Calling create-employee edge function...');
      
      const employeePayload = {
        companyId: user.companyId,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : null,
        address: data.address,
        phoneNumber: data.phoneNumber,
        role: data.role,
        trade: data.trade,
        position: data.position,
        hourlyRate: data.hourlyRate,
        workerType: data.workerType,
        photoUrl: photoUrl,
        certificates: certificateUrls,
      };
      
      console.log('📤 Sending payload to edge function:', {
        ...employeePayload,
        password: '[REDACTED]',
        certificatesCount: certificateUrls.length
      });
      
      const { data: result, error } = await supabase.functions.invoke('create-employee', {
        body: { employeeData: employeePayload }
      });
      
      console.log('📥 Edge function response received:', { 
        hasResult: !!result, 
        hasError: !!error,
        resultSuccess: result?.success,
        errorMessage: error?.message 
      });

      // Check if there was a network/connection error
      if (error) {
        console.error('❌ Edge Function connection error:', error);
        console.error('🔍 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500)
        });
        throw new Error(`Failed to connect to employee registration service: ${error.message}`);
      }

      // Check if we received a result
      if (!result) {
        console.error('❌ No result received from edge function');
        throw new Error('No response received from employee registration service');
      }

      console.log('✅ Edge function result details:', {
        success: result.success,
        hasUser: !!result.user,
        userId: result.user?.id,
        message: result.message,
        error: result.error
      });

      // Check if the result contains an error (from the edge function)
      if (!result.success) {
        console.error('❌ Employee registration error from edge function:', result.error);
        console.log('Error code:', result.errorCode);
        
        // Handle specific error codes with appropriate UI feedback
        if (result.errorCode === 'ORPHANED_AUTH_USER') {
          throw new Error(`🔐 Login Account Already Exists\n\n${result.error}\n\nThis requires administrator intervention to fix the data inconsistency.`);
        } else if (result.errorCode === 'ARCHIVED_EMPLOYEE_EXISTS') {
          throw new Error(`📦 Archived Employee Found\n\n${result.error}\n\nEmployee: ${result.employeeName || 'Unknown'}\n\nPlease reactivate the existing employee instead.`);
        } else if (result.errorCode === 'ACTIVE_EMPLOYEE_EXISTS') {
          throw new Error(`✓ Employee Already Active\n\n${result.error}\n\nEmployee: ${result.employeeName || 'Unknown'}`);
        } else {
          throw new Error(result.error || 'Employee registration failed');
        }
      }

      console.log('🎉 Employee registered successfully in edge function!');
      queryClient.invalidateQueries({ queryKey: ["employees"], exact: false });

      // Fetch the actual employee profile and add to context
      if (result.user) {
        setLoadingStep('Finalizing employee setup...');
        console.log('👤 Fetching employee profile for user:', result.user.id);
        
        // Add a longer delay to ensure database consistency (especially for foremen on slower connections)
        // await new Promise(resolve => setTimeout(resolve, 1000));
        
        // try {
        //   const { data: employeeProfile, error: fetchError } = await supabase
        //     .from('user_profiles')
        //     .select('*')
        //     .eq('user_id', result.user.id)
        //     .maybeSingle();

        //   if (!fetchError && employeeProfile) {
        //     console.log('✅ Successfully fetched employee profile:', {
        //       id: employeeProfile.id,
        //       email: employeeProfile.user_id,
        //       name: `${employeeProfile.first_name} ${employeeProfile.last_name}`,
        //       role: employeeProfile.role
        //     });
            
        //     // Add the real employee data to context
        //     // await createEmployee(employeeProfile);
        //     console.log('✅ Employee added to context successfully');
        //   } else {
        //     console.error('⚠️ Error fetching employee profile:', fetchError);
        //     console.log('🔄 Falling back to refreshing entire employee list...');
        //     // Refresh the employee list as fallback
        //     // await refreshEmployees();
        //   }
        // } catch (profileError) {
        //   console.error('❌ Critical error in profile fetch:', profileError);
        //   console.log('🔄 Falling back to refreshing entire employee list...');
        //   // await refreshEmployees();
        // }
      } else {
        console.warn('⚠️ No user data in successful result - refreshing employee list');
        // await refreshEmployees();
      }

      console.log('🎊 Registration process completed successfully!');
      
      toast({
        title: "Employee Registered Successfully",
        description: `${data.firstName} ${data.lastName} has been added to the system. They will be required to change their password on first login.`,
      });

      // Reset form
      form.reset();
      console.log('📝 Form reset after successful registration');
      
    } catch (error: any) {
      console.error('💥 Employee registration error:', error);
      console.error('🔍 Error context:', {
        loadingStep,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500)
      });
      
      // More specific error messages based on the loading step
      let errorTitle = "Registration Failed";
      let errorDescription = "Failed to register employee";
      
      if (loadingStep.includes('photo')) {
        errorTitle = "Photo Upload Failed";
        errorDescription = "Failed to upload employee photo. Please check the file size (max 5MB) and format (JPG, PNG).";
      } else if (loadingStep.includes('certificate')) {
        errorTitle = "Certificate Upload Failed";
        errorDescription = "Failed to upload certificate files. Please check the file sizes and formats.";
      } else if (loadingStep.includes('account')) {
        errorTitle = "Account Creation Failed";
        errorDescription = "Failed to create employee account. Please verify the email is not already in use.";
      } else if (loadingStep.includes('setup')) {
        errorTitle = "Setup Failed";
        errorDescription = "Employee account was created but final setup failed. Please check the employee list.";
      }
      
      // Add retry suggestion for foremen
      if (user?.role === 'foreman') {
        errorDescription += " If this keeps happening, try creating the employee without a photo first.";
      }
      
      toast({
        title: errorTitle,
        description: error.message || errorDescription,
        variant: "destructive",
      });
    } finally {
      console.log('🧹 Cleaning up registration state...');
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
