import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface JobsiteForeman {
  id: string;
  jobsite_id: string;
  foreman_id: string;
  created_at: string;
}

export interface ForemanDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Get all foremen assigned to a specific jobsite
export const useJobsiteForemen = (jobsiteId: string) => {
  return useQuery({
    queryKey: ['jobsite-foremen', jobsiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobsite_foremen')
        .select(`
          *,
          user_profiles!inner(
            user_id,
            first_name,
            last_name
          )
        `)
        .eq('jobsite_id', jobsiteId);

      if (error) {
        console.error('Error fetching jobsite foremen:', error);
        throw error;
      }

      return data;
    },
    enabled: !!jobsiteId,
  });
};

// Get all available foremen for assignment
export const useAvailableForemen = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-foremen', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) {
        throw new Error('No company ID available');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .eq('company_id', user.companyId)
        .eq('role', 'foreman')
        .eq('is_active', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching available foremen:', error);
        throw error;
      }

      return data.map(profile => ({
        id: profile.user_id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || ''
      })) as ForemanDetails[];
    },
    enabled: !!user?.companyId,
  });
};

// Assign foremen to a jobsite
export const useAssignForemen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobsiteId, foremanIds }: { jobsiteId: string; foremanIds: string[] }) => {
      // First, remove all existing assignments
      const { error: deleteError } = await supabase
        .from('jobsite_foremen')
        .delete()
        .eq('jobsite_id', jobsiteId);

      if (deleteError) {
        throw deleteError;
      }

      // Then add new assignments
      if (foremanIds.length > 0) {
        const assignments = foremanIds.map(foremanId => ({
          jobsite_id: jobsiteId,
          foreman_id: foremanId
        }));

        const { error: insertError } = await supabase
          .from('jobsite_foremen')
          .insert(assignments);

        if (insertError) {
          throw insertError;
        }
      }

      return { success: true };
    },
    onSuccess: (_, { jobsiteId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobsite-foremen', jobsiteId] });
      queryClient.invalidateQueries({ queryKey: ['foreman-jobsites'] });
      queryClient.invalidateQueries({ queryKey: ['jobsites'] });
    },
  });
};