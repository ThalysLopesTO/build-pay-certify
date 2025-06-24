
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useWorkWeek } from './useWorkWeek';

export const useWeeklyHoursSummary = () => {
  const { user } = useAuth();
  const workWeek = useWorkWeek();

  return useQuery({
    queryKey: ['weekly-hours-summary', user?.id, workWeek?.currentWeek?.weekStartDateString],
    queryFn: async () => {
      if (!user?.id || !workWeek?.currentWeek) return 0;

      const { data, error } = await supabase
        .from('weekly_timesheets')
        .select('total_hours')
        .eq('submitted_by', user.id)
        .eq('week_start_date', workWeek.currentWeek.weekStartDateString);

      if (error) {
        console.error('Error fetching weekly hours:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      // Sum up all timesheets for the week (in case there are multiple)
      const totalHours = data.reduce((sum, timesheet) => sum + (timesheet.total_hours || 0), 0);

      return totalHours;
    },
    enabled: !!user?.id && !!workWeek?.currentWeek,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
