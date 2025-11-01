import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyTaskList, DailyTaskItem } from '@/types/daily-tasks';

export interface TaskListWithTasks extends DailyTaskList {
  tasks: DailyTaskItem[];
}

export const useDailyTasksByDate = (jobsiteId: string | null, forDate: string | null) => {
  return useQuery({
    queryKey: ['daily-tasks-by-date', jobsiteId, forDate],
    queryFn: async () => {
      if (!jobsiteId || !forDate) return [];

      // Fetch all lists for this jobsite and date
      const { data: lists, error: listsError } = await supabase
        .from('daily_task_lists')
        .select('*')
        .eq('jobsite_id', jobsiteId)
        .eq('for_date', forDate)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;
      if (!lists || lists.length === 0) return [];

      // Fetch tasks for all these lists
      const listIds = lists.map((list) => list.id);
      const { data: tasks, error: tasksError } = await supabase
        .from('daily_task_items')
        .select('*')
        .in('list_id', listIds)
        .is('parent_item_id', null)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine lists with their tasks
      const listsWithTasks: TaskListWithTasks[] = lists.map((list) => ({
        ...list,
        tasks: (tasks || []).filter((task) => task.list_id === list.id),
      }));

      return listsWithTasks;
    },
    enabled: !!jobsiteId && !!forDate,
  });
};
