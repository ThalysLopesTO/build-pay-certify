
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export interface DailyHours {
  day: string;
  hours: number;
}

export const useWeeklyHoursSummary = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-hours-summary', user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalHours: 0, dailyHours: [] };

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('weekly_timesheets')
        .select('monday_hours, tuesday_hours, wednesday_hours, thursday_hours, friday_hours, saturday_hours, sunday_hours, total_hours')
        .eq('submitted_by', user.id)
        .gte('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('week_start_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) {
        console.error('Error fetching weekly hours:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalHours: 0,
          dailyHours: [
            { day: 'Mon', hours: 0 },
            { day: 'Tue', hours: 0 },
            { day: 'Wed', hours: 0 },
            { day: 'Thu', hours: 0 },
            { day: 'Fri', hours: 0 },
            { day: 'Sat', hours: 0 },
            { day: 'Sun', hours: 0 },
          ]
        };
      }

      // Sum up all timesheets for the week (in case there are multiple)
      const totalHours = data.reduce((sum, timesheet) => sum + (timesheet.total_hours || 0), 0);
      
      // Aggregate daily hours from all timesheets
      const dailyTotals = data.reduce((acc, timesheet) => ({
        monday: acc.monday + (timesheet.monday_hours || 0),
        tuesday: acc.tuesday + (timesheet.tuesday_hours || 0),
        wednesday: acc.wednesday + (timesheet.wednesday_hours || 0),
        thursday: acc.thursday + (timesheet.thursday_hours || 0),
        friday: acc.friday + (timesheet.friday_hours || 0),
        saturday: acc.saturday + (timesheet.saturday_hours || 0),
        sunday: acc.sunday + (timesheet.sunday_hours || 0),
      }), {
        monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0
      });

      const dailyHours: DailyHours[] = [
        { day: 'Mon', hours: dailyTotals.monday },
        { day: 'Tue', hours: dailyTotals.tuesday },
        { day: 'Wed', hours: dailyTotals.wednesday },
        { day: 'Thu', hours: dailyTotals.thursday },
        { day: 'Fri', hours: dailyTotals.friday },
        { day: 'Sat', hours: dailyTotals.saturday },
        { day: 'Sun', hours: dailyTotals.sunday },
      ];

      return { totalHours, dailyHours };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
