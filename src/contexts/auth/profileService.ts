
import { supabase } from '@/integrations/supabase/client';

export const fetchUserProfile = async (userId: string) => {
  try {
    console.log('📝 Fetching user profile for:', userId);
    
    // Query user_profiles with company data in a single query using join
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies (*)
      `)
      .eq('user_id', userId)
      .maybeSingle();

    console.log('📋 Profile query result:', { profileData, profileError });

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      
      // Check if user profile doesn't exist
      if (profileError.code === 'PGRST116') {
        return { profile: null, company: null, error: 'You are not linked to any company. Please contact your administrator.' };
      }
      
      return { profile: null, company: null, error: 'Failed to load user profile. Please try logging in again.' };
    }

    if (!profileData) {
      console.warn('⚠️ User profile not found');
      return { profile: null, company: null, error: 'You are not linked to any company. Please contact your administrator.' };
    }

    const profile = profileData;
    const company = Array.isArray(profileData.companies) ? profileData.companies[0] : profileData.companies;

    console.log('📊 Profile loaded:', profile);
    console.log('🏢 Company loaded:', company);

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

    if (!company) {
      console.warn('⚠️ Company not found for profile');
      return { profile: null, company: null, error: 'Your company account was not found. Please contact your system administrator.' };
    }

    // For Stripe verified companies, only check subscription status (handled by SubscriptionGate)
    if (company.stripe_verified) {
      console.log('💳 Company is Stripe verified - subscription status will be checked by SubscriptionGate');
    } else if (company.status !== 'active') {
      // Only check company status for non-Stripe companies
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
