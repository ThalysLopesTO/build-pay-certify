
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
      
      // First, create the auth user
      console.log('📝 Creating auth user for:', formData.adminEmail);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.adminFirstName,
            last_name: formData.adminLastName,
            role: 'admin'
          }
        }
      });

      if (authError) {
        console.error('❌ Auth user creation failed:', authError);
        toast({
          title: "Registration Error",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup');
        toast({
          title: "Registration Error",
          description: "Failed to create user account",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Auth user created successfully:', authData.user.id);

      // Create company with pending status
      console.log('🏢 Creating company record...');
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          status: 'pending'
        })
        .select()
        .single();

      if (companyError) {
        console.error('❌ Company creation failed:', companyError);
        toast({
          title: "Registration Error",
          description: `Failed to create company record: ${companyError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Company created successfully:', companyData.id);

      // Create user profile with pending approval
      console.log('👤 Creating user profile...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          company_id: companyData.id,
          role: 'admin',
          first_name: formData.adminFirstName,
          last_name: formData.adminLastName,
          pending_approval: true
        });

      if (profileError) {
        console.error('❌ User profile creation failed:', profileError);
        toast({
          title: "Registration Error",
          description: `Failed to create user profile: ${profileError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ User profile created successfully');

      // Create registration request record
      console.log('📋 Creating registration request...');
      const { error: requestError } = await supabase
        .from('company_registration_requests')
        .insert({
          company_id: companyData.id,
          admin_user_id: authData.user.id,
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
          description: `Failed to create registration request: ${requestError.message}`,
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
