import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface JobsiteTaskStats {
  jobsiteId: string;
  totalLists: number;
  totalTasks: number;
  completedTasks: number;
}

export const useJobsiteTaskStats = (jobsiteId: string) => {
  return useQuery({
    queryKey: ['jobsite-task-stats', jobsiteId],
    queryFn: async () => {
      // Get all open task lists for this jobsite
      const { data: lists, error: listsError } = await supabase
        .from('daily_task_lists')
        .select('id')
        .eq('jobsite_id', jobsiteId)
        .eq('status', 'open');

      if (listsError) throw listsError;

      if (!lists || lists.length === 0) {
        return {
          jobsiteId,
          totalLists: 0,
          totalTasks: 0,
          completedTasks: 0,
        };
      }

      // Get task counts for all lists
      const listIds = lists.map(l => l.id);
      
      const { data: tasks, error: tasksError } = await supabase
        .from('daily_task_items')
        .select('id, is_done')
        .in('list_id', listIds)
        .is('parent_item_id', null);

      if (tasksError) throw tasksError;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.is_done).length || 0;

      return {
        jobsiteId,
        totalLists: lists.length,
        totalTasks,
        completedTasks,
      } as JobsiteTaskStats;
    },
    enabled: !!jobsiteId,
  });
};

export const useAllJobsitesTaskStats = (jobsiteIds: string[]) => {
  return useQuery({
    queryKey: ['all-jobsites-task-stats', jobsiteIds],
    queryFn: async () => {
      if (jobsiteIds.length === 0) return [];

      const statsPromises = jobsiteIds.map(async (jobsiteId) => {
        const { data: lists } = await supabase
          .from('daily_task_lists')
          .select('id')
          .eq('jobsite_id', jobsiteId)
          .eq('status', 'open');

        if (!lists || lists.length === 0) {
          return {
            jobsiteId,
            totalLists: 0,
            totalTasks: 0,
            completedTasks: 0,
          };
        }

        const listIds = lists.map(l => l.id);
        
        const { data: tasks } = await supabase
          .from('daily_task_items')
          .select('id, is_done')
          .in('list_id', listIds)
          .is('parent_item_id', null);

        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.is_done).length || 0;

        return {
          jobsiteId,
          totalLists: lists.length,
          totalTasks,
          completedTasks,
        };
      });

      return await Promise.all(statsPromises);
    },
    enabled: jobsiteIds.length > 0,
  });
};
