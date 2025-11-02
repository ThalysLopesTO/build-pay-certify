import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyTaskList, DailyTaskItem } from '@/types/daily-tasks';
import { format, parseISO } from 'date-fns';

export interface TaskListWithTasks extends DailyTaskList {
  tasks: DailyTaskItem[];
}

export interface DateGroup {
  date: string;
  dateFormatted: string;
  lists: TaskListWithTasks[];
  totalTasks: number;
  completedTasks: number;
}

export interface PaginatedTaskLists {
  dateGroups: DateGroup[];
  totalPages: number;
  currentPage: number;
  totalDates: number;
  totalLists: number;
  totalTasks: number;
}

export const usePaginatedTaskLists = (
  jobsiteId: string | null,
  companyId: string,
  status: 'all' | 'pending' | 'completed' = 'all',
  page: number = 1,
  pageSize: number = 10
) => {
  return useQuery({
    queryKey: ['daily-task-lists-paginated', jobsiteId, companyId, status, page, pageSize],
    queryFn: async (): Promise<PaginatedTaskLists> => {
      if (!jobsiteId) {
        return {
          dateGroups: [],
          totalPages: 0,
          currentPage: page,
          totalDates: 0,
          totalLists: 0,
          totalTasks: 0,
        };
      }

      // Fetch all lists with tasks
      const { data: lists, error: listsError } = await supabase
        .from('daily_task_lists')
        .select('*')
        .eq('jobsite_id', jobsiteId)
        .eq('company_id', companyId)
        .order('for_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      // Fetch all tasks for these lists
      const listIds = lists?.map((list) => list.id) || [];
      
      if (listIds.length === 0) {
        return {
          dateGroups: [],
          totalPages: 0,
          currentPage: page,
          totalDates: 0,
          totalLists: 0,
          totalTasks: 0,
        };
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('daily_task_items')
        .select('*')
        .in('list_id', listIds)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Combine lists with their tasks
      const listsWithTasks: TaskListWithTasks[] = lists.map((list) => ({
        ...list,
        tasks: tasks?.filter((task) => task.list_id === list.id) || [],
      }));

      // Filter by status
      let filteredLists = listsWithTasks;
      if (status === 'pending') {
        filteredLists = listsWithTasks.filter((list) => {
          const completed = list.tasks.filter((t) => t.is_done).length;
          return completed < list.tasks.length;
        });
      } else if (status === 'completed') {
        filteredLists = listsWithTasks.filter((list) => {
          const completed = list.tasks.filter((t) => t.is_done).length;
          return list.tasks.length > 0 && completed === list.tasks.length;
        });
      }

      // Group by date
      const dateGroupsMap = new Map<string, TaskListWithTasks[]>();
      filteredLists.forEach((list) => {
        const date = list.for_date;
        if (!dateGroupsMap.has(date)) {
          dateGroupsMap.set(date, []);
        }
        dateGroupsMap.get(date)!.push(list);
      });

      // Convert to array and sort by date (newest first)
      const allDateGroups: DateGroup[] = Array.from(dateGroupsMap.entries())
        .map(([date, lists]) => {
          const allTasks = lists.flatMap((l) => l.tasks);
          return {
            date,
            dateFormatted: format(parseISO(date), 'EEEE, MMMM d, yyyy'),
            lists,
            totalTasks: allTasks.length,
            completedTasks: allTasks.filter((t) => t.is_done).length,
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));

      // Pagination
      const totalDates = allDateGroups.length;
      const totalPages = Math.ceil(totalDates / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedDateGroups = allDateGroups.slice(startIndex, endIndex);

      return {
        dateGroups: paginatedDateGroups,
        totalPages,
        currentPage: page,
        totalDates,
        totalLists: filteredLists.length,
        totalTasks: filteredLists.reduce((sum, list) => sum + list.tasks.length, 0),
      };
    },
    enabled: !!jobsiteId && !!companyId,
  });
};
