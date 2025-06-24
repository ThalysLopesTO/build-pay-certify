
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export const useWeeklyHoursSummary = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-hours-summary', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('weekly_timesheets')
        .select('total_hours')
        .eq('submitted_by', user.id)
        .gte('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('week_start_date', format(weekEnd, 'yyyy-MM-dd'));

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
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
