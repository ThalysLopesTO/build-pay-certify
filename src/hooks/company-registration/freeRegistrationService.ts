
import { supabase } from '@/integrations/supabase/client';
import { RegistrationFormData } from './types';
import * as CryptoJS from "crypto-js";
import { SECRET_KEY } from './constants';

export const processFreeRegistration = async (formData: RegistrationFormData) => {
  console.log('📝 Processing free registration - creating new company pending approval');
  
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
    console.error('❌ Free registration failed:', requestError);
    throw new Error(`Failed to submit registration request: ${requestError.message}`);
  }

  return {
    success: true,
    isPending: true
  };
};
