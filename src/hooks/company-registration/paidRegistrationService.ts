
import { supabase } from '@/integrations/supabase/client';
import { RegistrationFormData } from './types';

export const processPaidRegistration = async (
  formData: RegistrationFormData,
  sessionData: any
) => {
  console.log('🔧 Processing paid registration with session data:', sessionData);

  // Create the company first
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: formData.companyName,
      email: formData.companyEmail,
      phone: formData.companyPhone,
      address: formData.companyAddress,
      status: 'active',
      stripe_verified: true,
      plan_type: sessionData.metadata.plan_type,
      subscription_status: 'active',
      employee_limit: sessionData.metadata.employee_limit === 'unlimited' ? null : parseInt(sessionData.metadata.employee_limit),
      registration_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (companyError) {
    console.error('💥 Company creation error:', companyError);
    throw new Error(`Failed to create company: ${companyError.message}`);
  }

  console.log('✅ Company created:', company);

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.adminEmail,
    password: formData.password,
    options: {
      data: {
        first_name: formData.adminFirstName,
        last_name: formData.adminLastName,
        company_id: company.id,
        role: 'admin'
      }
    }
  });

  if (authError) {
    console.error('💥 Auth user creation error:', authError);
    throw new Error(`Failed to create user account: ${authError.message}`);
  }

  console.log('✅ Auth user created:', authData.user?.id);

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user!.id,
      company_id: company.id,
      role: 'admin',
      first_name: formData.adminFirstName,
      last_name: formData.adminLastName,
      pending_approval: false,
      stripe_verified: true,
    });

  if (profileError) {
    console.error('💥 Profile creation error:', profileError);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  console.log('✅ User profile created');

  return {
    companyName: company.name,
    planType: sessionData.metadata.plan_type,
    userId: authData.user!.id,
    companyId: company.id
  };
};
