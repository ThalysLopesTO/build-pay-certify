import { supabase } from '@/integrations/supabase/client';

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
  window.location.assign(dashboardPathForRole(role));
};
