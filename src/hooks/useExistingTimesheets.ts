
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useExistingTimesheets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['existing-timesheets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('weekly_timesheets')
        .select('week_start_date')
        .eq('submitted_by', user.id);

      if (error) {
        console.error('Error fetching existing timesheets:', error);
        throw error;
      }

      return data.map(timesheet => timesheet.week_start_date);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
