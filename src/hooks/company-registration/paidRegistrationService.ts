
import { supabase } from '@/integrations/supabase/client';
import { RegistrationFormData } from './types';
import * as CryptoJS from "crypto-js";
import { SECRET_KEY } from './constants';
import { sendWelcomeEmail } from '@/utils/sendWelcomeEmail';

export const processPaidRegistration = async (
  formData: RegistrationFormData,
  sessionId: string
) => {
  console.log('✅ Processing paid registration - creating new isolated company');

  const { data: result, error } = await supabase.functions.invoke('get-session-stripe', { body: { sessionId }});

  let plan = "starter";
  let employeeLimit = 10;
  const email = result?.customer_details?.email;

  if (formData.adminEmail !== email) {
    throw new Error("wrong email");
  }
 
  const planStripe = result.metadata.plan_name

  if (planStripe === "Premium") {
    employeeLimit = 20;
    plan = "pro";
  }

  // Create a NEW company for paid registrations
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: formData.companyName,
      status: 'active',
      registration_date: new Date().toISOString().split('T')[0],
      stripe_verified: true,  // Mark as Stripe verified
      plan: plan,  // Default to starter plan for paid registrations
      employee_limit: employeeLimit,  // Default starter limit
      subscription_status: "active"
    })
    .select()
    .single();

  if (companyError) {
    console.error('❌ Failed to create company:', companyError);
    throw new Error(`Failed to create company: ${companyError.message}`);
  }

  console.log('✅ New company created with ID:', company.id);
  console.log('✅ Company settings with default rules will be created automatically via database trigger');

  // Sign up the admin user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.adminEmail,
    password: formData.password,
    options: {
      data: {
        first_name: formData.adminFirstName,
        last_name: formData.adminLastName,
        role: 'admin',
        company_id: company.id  // Ensure company_id is in user metadata
      }
    }
  });

  if (authError) {
    console.error('❌ User signup failed:', authError);
    throw new Error(`Failed to create user account: ${authError.message}`);
  }

  console.log('✅ User signed up with ID:', authData.user?.id);

  // Sign the user in immediately
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.adminEmail,
    password: formData.password
  });

  if (signInError) {
    console.error('❌ Sign-in failed:', signInError);
    throw new Error(`Sign-in failed after registration: ${signInError.message}`);
  }

  console.log('✅ User signed in successfully');

  // Create user profile with the NEW company_id
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (profileCheckError) {
    console.error('❌ Profile existence check failed:', profileCheckError);
    throw new Error(`Failed to check profile existence: ${profileCheckError.message}`);
  }

  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        company_id: company.id,  // Use the NEW company ID
        first_name: formData.adminFirstName,
        last_name: formData.adminLastName,
        role: 'admin',
        pending_approval: false,
        stripe_verified: true
      });

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }
    
    console.log('✅ User profile created with company_id:', company.id);
  } else {
    console.log('ℹ️ User profile already exists — updating with correct company_id');
    
    // Update existing profile to ensure correct company_id
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        company_id: company.id,
        pending_approval: false,
        stripe_verified: true
      })
      .eq('user_id', authData.user.id);

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
      throw new Error(`Failed to update user profile: ${updateError.message}`);
    }
  }

  // Insert into registration_requests for tracking
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
      company_id: company.id,  // Link to the NEW company
      admin_user_id: authData.user.id,
      approved_at: new Date().toISOString()
    });

  if (requestError) {
    console.warn('⚠️ Failed to insert registration request log:', requestError);
  }

  // Send welcome email to new user
  try {
    await sendWelcomeEmail({
      to: formData.adminEmail,
      firstName: formData.adminFirstName,
      lastName: formData.adminLastName,
      companyName: formData.companyName
    });
    console.log('✅ Welcome email sent successfully');
  } catch (emailError) {
    console.warn('⚠️ Failed to send welcome email:', emailError);
    // Don't fail the registration if email fails
  }

  console.log('🎉 Registration completed successfully for new company:', company.id);

  return {
    success: true,
    companyId: company.id,
    companyName: formData.companyName
  };
};
