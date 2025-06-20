
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
    
    const paymentSuccess = searchParams.get('payment') === 'success';
    const sessionId = searchParams.get('session_id');
    
    console.log('💳 Payment status:', { paymentSuccess, sessionId });

    if (paymentSuccess && sessionId) {
      console.log('✅ Processing paid registration - auto-approval enabled');
      
      // 1. Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          status: 'active',
          registration_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (companyError) {
        throw new Error(`Failed to create company: ${companyError.message}`);
      }

      console.log('✅ Company created:', company);

      // 2. Sign up the admin
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
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      console.log('✅ User signed up:', authData.user?.id);

      // 3. Sign the user in immediately so auth.uid() works
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.adminEmail,
        password: formData.password
      });

      if (signInError) {
        throw new Error(`Sign-in failed after registration: ${signInError.message}`);
      }

      // 4. Get current authenticated user (needed for auth.uid())
      const { data: sessionUser, error: sessionError } = await supabase.auth.getUser();

      if (!sessionUser?.user || sessionError) {
        throw new Error("Failed to fetch authenticated user session.");
      }

      // 5. Insert user profile with auth.uid()
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: sessionUser.user.id,
          company_id: company.id,
          first_name: formData.adminFirstName,
          last_name: formData.adminLastName,
          role: 'admin',
          pending_approval: false
        });

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('✅ User profile created');

      // 6. Insert into registration_requests for tracking
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
          status: 'approved',
          company_id: company.id,
          admin_user_id: sessionUser.user.id,
          approved_at: new Date().toISOString()
        });

      if (requestError) {
        console.warn('⚠️ Failed to insert registration request log:', requestError);
      }

      toast({
        title: "Registration Complete!",
        description: "Your account has been created and activated. You can now sign in.",
      });

    } else {
      // Free user registration (pending approval)
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
          status: 'pending'
        });

      if (requestError) {
        throw new Error(`Failed to submit registration request: ${requestError.message}`);
      }

      toast({
        title: "Registration Submitted",
        description: "Your company registration has been submitted for approval.",
      });
    }

    setIsSubmitted(true);

  } catch (error) {
    console.error('💥 Registration error:', error);
    toast({
      title: "Registration Error",
      description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
