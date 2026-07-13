
import { supabase } from '@/integrations/supabase/client';
import { CompanyMembership } from './types';

interface FetchProfileOptions {
  // On session restore (page refresh) we honor the stored active-company
  // pointer; on a fresh SIGNED_IN we ignore it so multi-company users are
  // always asked which company to enter ("always ask" behavior).
  honorActivePointer?: boolean;
}

export interface FetchProfileResult {
  profile: any | null;
  company: any | null;
  error: string | null;
  memberships?: CompanyMembership[];
  needsCompanySelection?: boolean;
}

// Per-membership eligibility check; returns today's exact error messages so
// single-company users see no behavior change.
const membershipError = (profile: any, company: any): string | null => {
  if (profile.is_active === false) {
    return 'Your account has been deactivated. Please contact your administrator for assistance.';
  }
  if (!profile.stripe_verified && profile.pending_approval) {
    return 'Your company account is pending approval. You will receive an email notification once approved.';
  }
  if (!profile.company_id) {
    return 'You are not linked to any company. Please contact your administrator.';
  }
  if (!company) {
    return 'Your company account was not found. Please contact your system administrator.';
  }
  if (!company.stripe_verified && company.status !== 'active') {
    return 'Your company account is not active. Please contact your system administrator.';
  }
  return null;
};

const toMembership = (row: any): CompanyMembership => {
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
  return {
    companyId: row.company_id,
    companyName: company?.name || null,
    role: row.role,
    isActive: row.is_active !== false,
    pendingApproval: row.pending_approval || false,
    hourlyRate: row.hourly_rate || undefined,
    workerType: row.worker_type || undefined,
  };
};

export const fetchUserProfile = async (
  userId: string,
  options: FetchProfileOptions = {}
): Promise<FetchProfileResult> => {
  try {
    console.log('📝 Fetching user profile(s) for:', userId);

    // A user may hold profiles in multiple companies — fetch them all
    const { data: rows, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies (*)
      `)
      .eq('user_id', userId);

    console.log('📋 Profile query result:', { count: rows?.length, profileError });

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      if (profileError.code === 'PGRST116') {
        return { profile: null, company: null, error: 'You are not linked to any company. Please contact your administrator.' };
      }
      return { profile: null, company: null, error: 'Failed to load user profile. Please try logging in again.' };
    }

    if (!rows || rows.length === 0) {
      console.warn('⚠️ User profile not found');
      return { profile: null, company: null, error: 'You are not linked to any company. Please contact your administrator.' };
    }

    // Super admins don't need a company (existing bypass)
    const superAdminRow = rows.find((r) => r.role === 'super_admin');
    if (superAdminRow) {
      if (superAdminRow.is_active === false) {
        return {
          profile: null,
          company: null,
          error: 'Your account has been deactivated. Please contact your administrator for assistance.',
        };
      }
      console.log('👑 Super admin detected - bypassing company checks');
      return { profile: superAdminRow, company: null, error: null };
    }

    // Split usable memberships from blocked ones (keep today's error texts)
    const withCompany = rows.map((row) => ({
      row,
      company: Array.isArray(row.companies) ? row.companies[0] : row.companies,
    }));
    const usable = withCompany.filter(({ row, company }) => !membershipError(row, company));

    if (usable.length === 0) {
      // No usable membership: surface the same error a single-company user
      // would have seen (prefer an active row's error over an archived one's)
      const preferred =
        withCompany.find(({ row }) => row.is_active !== false) || withCompany[0];
      const error = membershipError(preferred.row, preferred.company);
      console.warn('⚠️ No usable membership:', error);
      return { profile: null, company: null, error };
    }

    const memberships = usable.map(({ row }) => toMembership(row));

    if (usable.length === 1) {
      const { row, company } = usable[0];
      console.log('✅ Resolved single membership:', row.company_id);
      return { profile: row, company, error: null, memberships };
    }

    // Multiple usable memberships
    if (options.honorActivePointer) {
      const { data: pointer } = await (supabase
        .from('user_active_company' as any) as any)
        .select('company_id')
        .eq('user_id', userId)
        .maybeSingle();

      const chosen = pointer?.company_id
        ? usable.find(({ row }) => row.company_id === pointer.company_id)
        : undefined;

      if (chosen) {
        console.log('✅ Resolved membership from active-company pointer:', chosen.row.company_id);
        return { profile: chosen.row, company: chosen.company, error: null, memberships };
      }
    }

    console.log('🏢 Multiple memberships - company selection required');
    return {
      profile: null,
      company: null,
      error: null,
      memberships,
      needsCompanySelection: true,
    };
  } catch (error) {
    console.error('💥 Error in fetchUserProfile:', error);
    return { profile: null, company: null, error: 'An unexpected error occurred. Please try again.' };
  }
};
