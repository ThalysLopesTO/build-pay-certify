import { supabase } from '@/integrations/supabase/client';

// Marks that the user actively picked a company in this browser session.
// Used to decide whether to re-show the picker (see useAuthState).
export const ACTIVE_COMPANY_SESSION_KEY = 'sb-active-company';

export const dashboardPathForRole = (role?: string): string => {
  switch (role) {
    case 'super_admin':
      return '/super-admin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'management':
      return '/management/dashboard';
    case 'foreman':
      return '/foreman/dashboard';
    case 'employee':
      return '/employee/dashboard';
    default:
      return '/';
  }
};

// Persist the chosen company server-side (validated against membership by the
// SECURITY DEFINER RPC), then do a full navigation so every query/cache starts
// clean inside the selected company.
export const activateCompany = async (companyId: string, role?: string): Promise<void> => {
  const { error } = await (supabase.rpc as any)('set_active_company', {
    p_company_id: companyId,
  });
  if (error) {
    throw new Error(error.message || 'Could not switch company');
  }
  // Remember the choice for THIS browser session so navigation, tab refocus,
  // and token refresh don't re-prompt. Cleared on logout (sessionStorage.clear()),
  // so a genuinely new login asks again ("always ask").
  try {
    sessionStorage.setItem(ACTIVE_COMPANY_SESSION_KEY, companyId);
  } catch {
    /* sessionStorage unavailable — fall back to prompting again, which is safe */
  }
  window.location.assign(dashboardPathForRole(role));
};
