
import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  id: string;
  role: 'super_admin' | 'admin' | 'foreman' | 'payroll' | 'employee';
  company_id: string;
  hourly_rate: number | null;
  trade: string | null;
  position: string | null;
  first_name: string | null;
  last_name: string | null;
  pending_approval: boolean;
}

export interface CompanyData {
  id: string;
  name: string;
}

export const fetchUserProfile = async (userId: string) => {
  try {
    console.log('🔍 Fetching profile for user:', userId);
    
    // Fetch user profile with company information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        company_id,
        hourly_rate,
        trade,
        position,
        first_name,
        last_name,
        pending_approval,
        companies!inner (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return { 
        profile: null, 
        company: null, 
        error: `Profile not found: ${profileError.message}` 
      };
    }

    if (!profile || !profile.companies) {
      console.warn('⚠️ No profile or company data found');
      return { 
        profile: null, 
        company: null, 
        error: 'Profile or company not found' 
      };
    }

    const company = Array.isArray(profile.companies) 
      ? profile.companies[0] 
      : profile.companies;

    console.log('✅ Profile and company fetched successfully');
    
    return {
      profile: {
        id: profile.id,
        role: profile.role,
        company_id: profile.company_id,
        hourly_rate: profile.hourly_rate,
        trade: profile.trade,
        position: profile.position,
        first_name: profile.first_name,
        last_name: profile.last_name,
        pending_approval: profile.pending_approval
      } as ProfileData,
      company: {
        id: company.id,
        name: company.name
      } as CompanyData,
      error: null
    };

  } catch (error) {
    console.error('💥 Unexpected error in fetchUserProfile:', error);
    return { 
      profile: null, 
      company: null, 
      error: 'An unexpected error occurred while fetching profile' 
    };
  }
};
