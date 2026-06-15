import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyUsage {
  last_login: string | null;
  member_count: number;
}

/**
 * Per-company usage (last login) for the Super Admin. Backed by the
 * super_admin_company_usage() SQL function (company_usage_migration.sql).
 * Fails gracefully to an empty map if the function isn't installed yet, so the
 * dashboard keeps working until the migration is run.
 */
export const useCompanyUsage = () => {
  return useQuery({
    queryKey: ['super-admin-company-usage'],
    queryFn: async (): Promise<Record<string, CompanyUsage>> => {
      // Cast: the RPC isn't in the generated types until the migration is run.
      const { data, error } = await (supabase as any).rpc('super_admin_company_usage');
      if (error) {
        console.warn('Company usage unavailable (run company_usage_migration.sql):', error.message);
        return {};
      }
      const map: Record<string, CompanyUsage> = {};
      (data ?? []).forEach((r: any) => {
        map[r.company_id] = { last_login: r.last_login, member_count: Number(r.member_count) };
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
};
