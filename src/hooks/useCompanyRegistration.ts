
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationFormData {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  password: string;
}

export const useCompanyRegistration = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🚀 Starting company registration process...');
      
      // Only insert into company_registration_requests table
      console.log('📋 Creating registration request...');
      const { error: requestError } = await supabase
        .from('company_registration_requests')
        .insert({
          company_name: formData.companyName,
          company_email: formData.companyEmail,
          company_phone: formData.companyPhone,
          company_address: formData.companyAddress,
          admin_first_name: formData.adminFirstName,
          admin_last_name: formData.adminLastName,
          admin_email: formData.adminEmail,
          status: 'pending'
        });

      if (requestError) {
        console.error('❌ Registration request creation failed:', requestError);
        toast({
          title: "Registration Error",
          description: `Failed to submit registration request: ${requestError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Registration request created successfully');
      console.log('🎉 Company registration process completed successfully!');

      setIsSubmitted(true);
      toast({
        title: "Registration Submitted",
        description: "Your company registration has been submitted for approval",
      });

    } catch (error) {
      console.error('💥 Unexpected error during registration:', error);
      toast({
        title: "Registration Error",
        description: "Something went wrong. Please try again later or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    isSubmitted,
    handleInputChange,
    handleSubmit
  };
};
