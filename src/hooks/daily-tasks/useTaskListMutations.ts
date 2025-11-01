import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTaskListMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createList = useMutation({
    mutationFn: async (data: {
      title: string;
      jobsite_id: string;
      company_id: string;
      for_date: string;
    }) => {
      const { data: result, error } = await supabase
        .from('daily_task_lists')
        .insert({
          ...data,
          status: 'open',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks-by-date'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-dates'] });
      queryClient.invalidateQueries({ queryKey: ['jobsite', 'tasks'] });
      toast({ title: 'Task list created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create task list', variant: 'destructive' });
    },
  });

  const updateList = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<any> }) => {
      const { error } = await supabase
        .from('daily_task_lists')
        .update(data.updates)
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks-by-date'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-dates'] });
      queryClient.invalidateQueries({ queryKey: ['jobsite', 'tasks'] });
      toast({ title: 'Task list updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update task list', variant: 'destructive' });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      // First delete all tasks in the list
      const { error: tasksError } = await supabase
        .from('daily_task_items')
        .delete()
        .eq('list_id', id);

      if (tasksError) throw tasksError;

      // Then delete the list
      const { error } = await supabase
        .from('daily_task_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks-by-date'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-dates'] });
      queryClient.invalidateQueries({ queryKey: ['jobsite', 'tasks'] });
      toast({ title: 'Task list deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete task list', variant: 'destructive' });
    },
  });

  const closeList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_task_lists')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks-by-date'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-dates'] });
      queryClient.invalidateQueries({ queryKey: ['jobsite', 'tasks'] });
      toast({ title: 'Task list closed successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to close task list', variant: 'destructive' });
    },
  });

  const duplicateList = useMutation({
    mutationFn: async (data: { listId: string; newDate: string; newJobsiteId?: string }) => {
      // Fetch original list and its tasks
      const { data: originalList, error: listError } = await supabase
        .from('daily_task_lists')
        .select('*')
        .eq('id', data.listId)
        .single();

      if (listError) throw listError;

      const { data: originalTasks, error: tasksError } = await supabase
        .from('daily_task_items')
        .select('*')
        .eq('list_id', data.listId)
        .is('parent_item_id', null);

      if (tasksError) throw tasksError;

      // Create new list
      const { data: newList, error: newListError } = await supabase
        .from('daily_task_lists')
        .insert({
          title: originalList.title,
          jobsite_id: data.newJobsiteId || originalList.jobsite_id,
          company_id: originalList.company_id,
          for_date: data.newDate,
          status: 'open',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (newListError) throw newListError;

      // Duplicate tasks
      if (originalTasks && originalTasks.length > 0) {
        const newTasks = originalTasks.map((task) => ({
          list_id: newList.id,
          title: task.title,
          notes: task.notes,
          priority: task.priority,
          order_index: task.order_index,
          created_by: (newList.created_by),
        }));

        const { error: insertError } = await supabase
          .from('daily_task_items')
          .insert(newTasks);

        if (insertError) throw insertError;
      }

      return newList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks-by-date'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-dates'] });
      queryClient.invalidateQueries({ queryKey: ['jobsite', 'tasks'] });
      toast({ title: 'Task list duplicated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to duplicate task list', variant: 'destructive' });
    },
  });

  return {
    createList,
    updateList,
    deleteList,
    closeList,
    duplicateList,
  };
};
