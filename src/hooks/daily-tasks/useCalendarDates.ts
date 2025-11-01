import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeyFactory';

export const useCalendarDates = (jobsiteId: string | null, month: number, year: number) => {
  return useQuery({
    queryKey: ['calendar-dates', jobsiteId, month, year],
    queryFn: async () => {
      if (!jobsiteId) return [];

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const { data, error } = await supabase
        .from('daily_task_lists')
        .select('for_date')
        .eq('jobsite_id', jobsiteId)
        .eq('status', 'open')
        .gte('for_date', startOfMonth.toISOString().split('T')[0])
        .lte('for_date', endOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      // Return unique dates
      const uniqueDates = [...new Set(data.map((item) => item.for_date))];
      return uniqueDates;
    },
    enabled: !!jobsiteId,
  });
};
