import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyTaskList } from '@/types/daily-tasks';
import { queryKeys } from '@/lib/queryKeyFactory';

export const useDailyTaskLists = (jobsiteId: string | null) => {
  return useQuery({
    queryKey: queryKeys.jobsite.tasks(jobsiteId || ''),
    queryFn: async () => {
      if (!jobsiteId) return [];

      const { data, error } = await supabase
        .from('daily_task_lists')
        .select('*')
        .eq('jobsite_id', jobsiteId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DailyTaskList[];
    },
    enabled: !!jobsiteId,
  });
};
