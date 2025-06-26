
import { supabase } from '@/integrations/supabase/client';

// Simple type definitions to avoid deep type instantiation
interface UserProfile {
  user_id: string;
  role: string;
  company_id: string;
  first_name?: string;
  last_name?: string;
  hourly_rate?: number;
  trade?: string;
  position?: string;
  stripe_verified?: boolean;
  pending_approval?: boolean;
}

interface Company {
  id: string;
  name: string;
  status: string;
  subscription_override?: boolean;
  stripe_verified?: boolean;
}

interface ProfileServiceResult {
  profile: UserProfile | null;
  company: Company | null;
  error: string | null;
}

export const fetchUserProfile = async (userId: string): Promise<ProfileServiceResult> => {
  try {
    console.log('📝 Fetching user profile for:', userId);
    
    // Get the user's email from auth
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = authUser.user?.email;
    
    if (!userEmail) {
      console.error('❌ No user email found');
      return { profile: null, company: null, error: 'User email not found' };
    }

    console.log('📧 User email:', userEmail);

    // First, check if this user is a company owner (admin_email in companies table)
    const { data: ownedCompany, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('admin_email', userEmail)
      .maybeSingle();

    console.log('🏢 Company ownership check:', { ownedCompany, companyError });

    if (ownedCompany && !companyError) {
      // User is a company owner - create/update their profile as admin
      console.log('👑 User is company owner, setting as admin');
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let profile: UserProfile;
      if (existingProfile) {
        // Update existing profile to admin role
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            role: 'admin',
            company_id: ownedCompany.id,
            first_name: existingProfile.first_name || 'Admin',
            last_name: existingProfile.last_name || 'User'
          })
          .eq('user_id', userId)
          .select('*')
          .single();

        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
          return { profile: null, company: null, error: 'Failed to update user profile' };
        }
        profile = updatedProfile;
      } else {
        // Create new admin profile
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            role: 'admin',
            company_id: ownedCompany.id,
            first_name: 'Admin',
            last_name: 'User'
          })
          .select('*')
          .single();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          return { profile: null, company: null, error: 'Failed to create user profile' };
        }
        profile = newProfile;
      }

      console.log('✅ Company owner profile resolved:', profile);
      return { profile, company: ownedCompany, error: null };
    }

    // If not a company owner, check for existing user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('📋 Profile query result:', { profile, profileError });

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
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
    const { data: company, error: companyQueryError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .maybeSingle();

    console.log('🏢 Company query result:', { company, companyQueryError });

    if (companyQueryError || !company) {
      console.warn('⚠️ Company not found:', companyQueryError);
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
