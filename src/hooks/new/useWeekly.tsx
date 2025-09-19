import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useNearlyTimesheet = (availableWeeks: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nearly-timesheets', availableWeeks], // ✅ include weekStartDates in key
    queryFn: async () => {
      if (availableWeeks.length === 0) return [];
      const { data, error } = await supabase
        .from('weekly_timesheets_2')
        .select(`*,
          jobsite:jobsite_id (
            id,
            name
          )`)
        .eq('submitted_by', user.id)
        .neq('status', 'rejected')
        .in('week_start_date', availableWeeks);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: availableWeeks.length > 0 || !user,
  });
};
