import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { queryKeys } from '@/lib/queryKeyFactory';
import { CACHE_STRATEGIES } from '@/lib/optimizedQueryClient';

// Hot data with longer stale time
export const useCompanySettings = () => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.company.settings(user?.companyId || ''),
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user.companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
    ...CACHE_STRATEGIES.SEMI_STATIC,
  });
};

export const useJobsites = () => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.jobsite.list(user?.companyId || ''),
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');
      
      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name, address, status, assigned_foreman_id')
        .eq('company_id', user.companyId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
    ...CACHE_STRATEGIES.SEMI_STATIC,
  });
};

// Frequently changing data with shorter stale time
export const useMaterialRequests = (filters?: any) => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.material.requests(user?.companyId || '', filters),
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');
      
      let query = supabase
        .from('material_requests')
        .select(`
          id,
          material_list,
          delivery_date,
          status,
          created_at,
          jobsite_id,
          jobsites!inner(name)
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
    ...CACHE_STRATEGIES.DYNAMIC,
  });
};

export const useNotifications = () => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.notification.list(user?.companyId || '', user?.role || ''),
    queryFn: async () => {
      if (!user?.companyId || !user?.role) throw new Error('No company ID or role');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, description, type, created_at, is_read, is_dismissed')
        .eq('company_id', user.companyId)
        .eq('user_role', user.role)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId && !!user?.role,
    ...CACHE_STRATEGIES.REALTIME,
  });
};