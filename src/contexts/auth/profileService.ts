
import { supabase } from '@/integrations/supabase/client';

export const fetchUserProfile = async (userId: string) => {
  try {
    console.log('📝 Fetching user profile for:', userId);
    
    // Query user_profiles using user_id (matching auth.users.id)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('📋 Profile query result:', { profile, profileError });

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      
      // Check if user profile doesn't exist
      if (profileError.code === 'PGRST116') {
        return { profile: null, company: null, error: 'You are not linked to any company. Please contact your administrator.' };
      }
      
      return { profile: null, company: null, error: 'Failed to load user profile. Please try logging in again.' };
    }

    if (!profile) {
      console.warn('⚠️ User profile not found');
      return { profile: null, company: null, error: 'You are not linked to any company. Please contact your administrator.' };
    }

    console.log('📊 Profile loaded:', profile);

    // For paid users (Stripe verified), skip approval check
    if (profile.stripe_verified) {
      console.log('💳 User is Stripe verified - bypassing approval check');
    } else if (profile.pending_approval) {
      // Only check pending approval for non-Stripe users
      console.warn('⚠️ User is pending approval');
      return { profile: null, company: null, error: 'Your company account is pending approval. You will receive an email notification once approved.' };
    }

    if (!profile.company_id) {
      console.warn('⚠️ User not assigned to company');
      return { profile: null, company: null, error: 'You are not linked to any company. Please contact your administrator.' };
    }

    // Query companies using company_id from profile
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    console.log('🏢 Company query result:', { company, companyError });

    if (companyError || !company) {
      console.warn('⚠️ Company not found:', companyError);
      return { profile: null, company: null, error: 'Your company account was not found. Please contact your system administrator.' };
    }

    // Check for subscription override or Stripe verification
    if (company.subscription_override) {
      console.log('🎯 Company has subscription override - bypassing status checks');
    } else if (company.stripe_verified) {
      console.log('💳 Company is Stripe verified - subscription status will be checked by SubscriptionGate');
    } else if (company.status !== 'active') {
      // Only check company status for non-override, non-Stripe companies
      console.warn('⚠️ Company not active, status:', company.status);
      return { profile: null, company: null, error: 'Your company account is not active. Please contact your system administrator.' };
    }

    console.log('✅ Resolved Profile:', profile);
    console.log('✅ Resolved Company:', company);
    
    return { profile, company, error: null };
  } catch (error) {
    console.error('💥 Error in fetchUserProfile:', error);
    return { profile: null, company: null, error: 'An unexpected error occurred. Please try again.' };
  }
};
