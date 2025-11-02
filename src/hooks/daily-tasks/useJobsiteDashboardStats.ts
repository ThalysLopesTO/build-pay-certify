import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JobsiteDashboardStats {
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  totalLists: number;
  completionPercentage: number;
}

export const useJobsiteDashboardStats = (jobsiteId: string | null, companyId: string) => {
  return useQuery({
    queryKey: ['jobsite-dashboard-stats', jobsiteId, companyId],
    queryFn: async (): Promise<JobsiteDashboardStats> => {
      if (!jobsiteId) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          incompleteTasks: 0,
          totalLists: 0,
          completionPercentage: 0,
        };
      }

      // Fetch all open lists for this jobsite
      const { data: lists, error: listsError } = await supabase
        .from('daily_task_lists')
        .select('id')
        .eq('jobsite_id', jobsiteId)
        .eq('company_id', companyId)
        .eq('status', 'open');

      if (listsError) throw listsError;

      const totalLists = lists?.length || 0;

      if (totalLists === 0) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          incompleteTasks: 0,
          totalLists: 0,
          completionPercentage: 0,
        };
      }

      // Fetch all tasks for these lists
      const listIds = lists.map((list) => list.id);
      const { data: tasks, error: tasksError } = await supabase
        .from('daily_task_items')
        .select('is_done')
        .in('list_id', listIds);

      if (tasksError) throw tasksError;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((task) => task.is_done).length || 0;
      const incompleteTasks = totalTasks - completedTasks;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalTasks,
        completedTasks,
        incompleteTasks,
        totalLists,
        completionPercentage,
      };
    },
    enabled: !!jobsiteId && !!companyId,
  });
};
