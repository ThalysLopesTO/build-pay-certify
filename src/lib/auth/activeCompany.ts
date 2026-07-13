import { supabase } from '@/integrations/supabase/client';

// The user's currently active company, resolved server-side by
// get_user_company_id() (active-company pointer, falling back to the first
// membership). Use this instead of querying user_profiles by user_id alone —
// a user can hold profiles in multiple companies.
export const getActiveCompanyId = async (): Promise<string | null> => {
  const { data, error } = await (supabase.rpc as any)('get_user_company_id');
  if (error) {
    console.error('Error resolving active company:', error);
    return null;
  }
  return (data as string | null) ?? null;
};
