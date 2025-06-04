
import { supabase } from '@/integrations/supabase/client';

export const fetchUserProfile = async (userId: string) => {
  try {
    console.log('📝 Fetching user profile for:', userId);
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          status
        )
      `)
      .eq('user_id', userId)
      .single();

    console.log('📋 Profile query result:', { profile, profileError });

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      
      // Check if user profile doesn't exist
      if (profileError.code === 'PGRST116') {
        return { profile: null, error: 'You are not linked to any company. Please contact your administrator.' };
      }
      
      return { profile: null, error: 'Failed to load user profile. Please try logging in again.' };
    }

    if (!profile) {
      console.warn('⚠️ User profile not found');
      return { profile: null, error: 'You are not linked to any company. Please contact your administrator.' };
    }

    console.log('📊 Profile loaded:', profile);

    // Check if user is pending approval
    if (profile.pending_approval) {
      console.warn('⚠️ User is pending approval');
      return { profile: null, error: 'Your company account is pending approval. You will receive an email notification once approved.' };
    }

    if (!profile.company_id) {
      console.warn('⚠️ User not assigned to company');
      return { profile: null, error: 'You are not linked to any company. Please contact your administrator.' };
    }

    if (!profile.companies) {
      console.warn('⚠️ Company information missing');
      return { profile: null, error: 'Company information is missing. Please contact your administrator.' };
    }

    console.log('🏢 Company loaded:', profile.companies);

    if (profile.companies.status === 'pending') {
      console.warn('⚠️ Company is pending approval');
      return { profile: null, error: 'Your company account is pending approval. You will receive an email notification once approved.' };
    }

    if (profile.companies.status !== 'active') {
      console.warn('⚠️ Company not active, status:', profile.companies.status);
      return { profile: null, error: 'Your company account is not active. Please contact your system administrator.' };
    }

    console.log('✅ User profile and company loaded successfully');
    return { profile, error: null };
  } catch (error) {
    console.error('💥 Error in fetchUserProfile:', error);
    return { profile: null, error: 'An unexpected error occurred. Please try again.' };
  }
};
