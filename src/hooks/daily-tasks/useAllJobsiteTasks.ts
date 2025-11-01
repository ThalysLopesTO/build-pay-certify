import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyTaskItem } from '@/types/daily-tasks';
import { queryKeys } from '@/lib/queryKeyFactory';

export interface TaskWithList extends DailyTaskItem {
  list_name: string;
  list_id: string;
}

export const useAllJobsiteTasks = (jobsiteId: string | null) => {
  return useQuery({
    queryKey: queryKeys.jobsite.tasks(jobsiteId || ''),
    queryFn: async () => {
      if (!jobsiteId) return [];

      // First, get all open lists for this jobsite
      const { data: lists, error: listsError } = await supabase
        .from('daily_task_lists')
        .select('id, title')
        .eq('jobsite_id', jobsiteId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;
      if (!lists || lists.length === 0) return [];

      // Get all list IDs
      const listIds = lists.map((list) => list.id);

      // Fetch all tasks for these lists in one query
      const { data: tasks, error: tasksError } = await supabase
        .from('daily_task_items')
        .select(`
          *,
          daily_task_item_assignees (
            id,
            item_id,
            user_id,
            assigned_by,
            assigned_at,
            user_profiles (
              user_id,
              first_name,
              last_name,
              photo_url
            )
          )
        `)
        .in('list_id', listIds)
        .is('parent_item_id', null)
        .order('list_id', { ascending: true })
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine tasks with their list information
      const tasksWithList: TaskWithList[] = (tasks || []).map((task) => {
        const list = lists.find((l) => l.id === task.list_id);
        return {
          ...task,
          list_name: list?.title || 'Unknown List',
          list_id: task.list_id,
        } as TaskWithList;
      });

      return tasksWithList;
    },
    enabled: !!jobsiteId,
  });
};
