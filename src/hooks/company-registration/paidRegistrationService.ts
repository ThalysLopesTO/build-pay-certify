
import { supabase } from '@/integrations/supabase/client';
import { RegistrationFormData } from './types';
import * as CryptoJS from "crypto-js";
import { SECRET_KEY } from './constants';
import { sendWelcomeEmail } from '@/utils/emails/sendWelcomeEmail';

export const processPaidRegistration = async (
  formData: RegistrationFormData,
  sessionId: string
) => {
  console.log('✅ Processing paid registration - creating new isolated company');

  try {
    // Validate and retrieve Stripe session
    const { data: result, error: stripeError } = await supabase.functions.invoke('get-session-stripe', { 
      body: { sessionId }
    });

    if (stripeError) {
      console.error('❌ Stripe session validation failed:', stripeError);
      throw new Error(`Payment validation failed: ${stripeError.message || 'Unable to verify payment'}`);
    }

    if (!result) {
      throw new Error('Payment session not found or invalid');
    }

    const customerEmail = result?.customer_details?.email;

    if (!customerEmail) {
      throw new Error('Customer email not found in payment session');
    }

    if (formData.adminEmail.toLowerCase() !== customerEmail.toLowerCase()) {
      throw new Error(`Email mismatch: Registration email (${formData.adminEmail}) must match payment email (${customerEmail})`);
    }
    
    // Determine plan from subscription amount
    let plan = 'builder'; // default
    let employeeLimit = 10;
    let planFeatures = {
      billsExpenses: true,
      materialRequests: true,
      personalSupport: true,
      customSupport: false
    };

    if (result?.subscription) {
      const amount = result.subscription.items?.data?.[0]?.price?.unit_amount || 0;
      
      if (amount === 4990) {
        plan = 'start';
        employeeLimit = 5;
        planFeatures = {
          billsExpenses: false,
          materialRequests: false,
          personalSupport: false,
          customSupport: false
        };
      } else if (amount === 8990) {
        plan = 'builder';
        employeeLimit = 10;
        planFeatures = {
          billsExpenses: true,
          materialRequests: true,
          personalSupport: true,
          customSupport: false
        };
      } else if (amount === 12990) {
        plan = 'builder_pro';
        employeeLimit = 50;
        planFeatures = {
          billsExpenses: true,
          materialRequests: true,
          personalSupport: true,
          customSupport: true
        };
      }
    }

    console.log('✅ Payment validated successfully', { 
      plan, 
      employeeLimit,
      email: customerEmail,
      sessionId: sessionId.substring(0, 20) + '...' 
    });

  // Sign up the admin user FIRST to satisfy RLS policies
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
    console.error('❌ User signup failed:', authError);
    throw new Error(`Failed to create user account: ${authError.message}`);
  }

  console.log('✅ User signed up with ID:', authData.user?.id);

  // Sign the user in immediately to authenticate before creating company
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.adminEmail,
    password: formData.password
  });

  if (signInError) {
    console.error('❌ Sign-in failed:', signInError);
    throw new Error(`Sign-in failed after registration: ${signInError.message}`);
  }

  console.log('✅ User signed in successfully');

  // Now create the company with authenticated user (satisfies RLS policies)
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: formData.companyName,
      status: 'active',
      registration_date: new Date().toISOString().split('T')[0],
      stripe_verified: true,
      plan: plan,
      employee_limit: employeeLimit,
      plan_features: planFeatures,
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

    // Send StackBuild welcome email with login credentials
    try {
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: formData.adminEmail,
          firstName: formData.adminFirstName || 'User',
          lastName: formData.adminLastName || '',
          companyName: formData.companyName,
          password: formData.password
        }
      });
      
      if (emailError) {
        console.warn('⚠️ Welcome email failed (non-blocking):', emailError);
      } else {
        console.log('✅ StackBuild welcome email with credentials sent successfully');
      }
    } catch (emailError) {
      console.warn('⚠️ Welcome email error (non-blocking):', emailError);
    }

    console.log('🎉 Registration completed successfully for new company:', company.id);

    return {
      success: true,
      companyId: company.id,
      companyName: formData.companyName
    };

  } catch (error) {
    console.error('💥 Paid registration failed:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Payment validation failed')) {
        throw new Error('Unable to verify your payment. Please contact support if you were charged.');
      }
      if (error.message.includes('Email mismatch')) {
        throw new Error('The email address must match the one used for payment.');
      }
      if (error.message.includes('already been used')) {
        throw new Error('This payment has already been used to create an account. Please contact support.');
      }
      throw error;
    }
    
    throw new Error('Registration failed. Please try again or contact support.');
  }
};
