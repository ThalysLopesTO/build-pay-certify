import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Query key factories for consistent caching
export const queryKeys = {
  companySettings: (companyId: string) => ['company-settings', companyId],
  userProfile: (userId: string) => ['user-profile', userId],
  jobsites: (companyId: string) => ['jobsites', companyId],
  timesheets: (userId: string, date: string) => ['timesheets', userId, date],
  materialRequests: (companyId: string, filters?: any) => ['material-requests', companyId, filters],
  notifications: (companyId: string) => ['notifications', companyId],
};

// Hot data with longer stale time
export const useCompanySettings = () => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.companySettings(user?.companyId || ''),
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useJobsites = () => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.jobsites(user?.companyId || ''),
    queryFn: async () => {
      if (!user?.companyId) throw new Error('No company ID');
      
      const { data, error } = await supabase
        .from('jobsites')
        .select('id, name, address, status, assigned_foreman_id')
        .eq('company_id', user.companyId)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// Frequently changing data with shorter stale time
export const useMaterialRequests = (filters?: any) => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.materialRequests(user?.companyId || '', filters),
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
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

export const useNotifications = () => {
  const { user } = useAuth();
  const supabase = getSupabase();

  return useQuery({
    queryKey: queryKeys.notifications(user?.companyId || ''),
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
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
  });
};