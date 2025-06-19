
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import * as CryptoJS from "crypto-js";

export const SECRET_KEY = "my-temp-sec";

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
  const [searchParams] = useSearchParams();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🚀 Starting company registration process...');
      
      // Check if this is a paid registration (coming from Stripe)
      const paymentSuccess = searchParams.get('payment') === 'success';
      const sessionId = searchParams.get('session_id');
      
      console.log('💳 Payment status:', { paymentSuccess, sessionId });

      if (paymentSuccess && sessionId) {
        // This is a paid registration - create company and user directly
        console.log('✅ Processing paid registration - auto-approval enabled');
        
        // 1. Create the company with active status
        console.log('🏢 Creating company...');
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.companyName,
            status: 'active', // Auto-approve for paid users
            registration_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (companyError) {
          console.error('❌ Company creation failed:', companyError);
          throw new Error(`Failed to create company: ${companyError.message}`);
        }

        console.log('✅ Company created:', company);

        // 2. Create the admin user account
        console.log('👤 Creating admin user...');
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
          console.error('❌ User creation failed:', authError);
          throw new Error(`Failed to create user account: ${authError.message}`);
        }

        console.log('✅ User created:', authData.user?.id);

        // 3. Create user profile (auto-approved for paid users)
        if (authData.user) {
          console.log('📋 Creating user profile...');
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              company_id: company.id,
              first_name: formData.adminFirstName,
              last_name: formData.adminLastName,
              role: 'admin',
              pending_approval: false // Auto-approve for paid users
            });

          if (profileError) {
            console.error('❌ Profile creation failed:', profileError);
            throw new Error(`Failed to create user profile: ${profileError.message}`);
          }

          console.log('✅ User profile created');
        }

        // 4. Create registration request record for tracking (marked as approved)
        console.log('📝 Creating registration request record...');
        const encrypted = CryptoJS.AES.encrypt(formData.password, SECRET_KEY).toString();
        
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
            admin_password: encrypted,
            status: 'approved', // Auto-approve for paid users
            company_id: company.id,
            admin_user_id: authData.user?.id,
            approved_at: new Date().toISOString()
          });

        if (requestError) {
          console.error('⚠️ Registration request creation failed:', requestError);
          // Don't throw error here as the main registration succeeded
        }

        console.log('🎉 Paid registration completed successfully!');
        
        toast({
          title: "Registration Complete!",
          description: "Your account has been created and activated. You can now sign in.",
        });

      } else {
        // This is a regular registration - requires approval
        console.log('📋 Processing regular registration - approval required');
        const encrypted = CryptoJS.AES.encrypt(formData.password, SECRET_KEY).toString();

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
            admin_password: encrypted,
            status: 'pending' // Requires approval for free users
          });

        if (requestError) {
          console.error('❌ Registration request creation failed:', requestError);
          throw new Error(`Failed to submit registration request: ${requestError.message}`);
        }

        console.log('✅ Registration request submitted for approval');
        
        toast({
          title: "Registration Submitted",
          description: "Your company registration has been submitted for approval",
        });
      }

      setIsSubmitted(true);

    } catch (error) {
      console.error('💥 Unexpected error during registration:', error);
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again later or contact support.",
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
