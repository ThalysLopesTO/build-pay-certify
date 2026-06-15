import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlatformUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  company_id: string | null;
  company_name: string;
  is_active: boolean;
  photo_url: string | null;
  created_at: string;
}

/**
 * Platform-wide user directory for the Super Admin — every user across every
 * company, with the company name resolved.
 */
export const usePlatformUsers = () => {
  return useQuery({
    queryKey: ['super-admin-platform-users'],
    queryFn: async (): Promise<PlatformUser[]> => {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email, role, company_id, is_active, photo_url, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const companyIds = [...new Set((profiles ?? []).map(p => p.company_id).filter(Boolean))] as string[];
      let companyMap: Record<string, string> = {};
      if (companyIds.length) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);
        companyMap = Object.fromEntries((companies ?? []).map(c => [c.id, c.name]));
      }

      return (profiles ?? []).map(p => ({
        ...p,
        is_active: p.is_active ?? true,
        company_name: p.company_id ? (companyMap[p.company_id] ?? '—') : '—',
      })) as PlatformUser[];
    },
  });
};

export const useToggleUserActive = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);
      if (error) throw error;
      return { userId, isActive };
    },
    onSuccess: ({ isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-platform-users'] });
      toast({
        title: isActive ? 'User activated' : 'User deactivated',
        description: isActive
          ? 'The user can access the platform again.'
          : 'The user has been deactivated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update the user.',
        variant: 'destructive',
      });
    },
  });
};
