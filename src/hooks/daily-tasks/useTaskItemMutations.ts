import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTaskItemMutations = () => {
  const queryClient = useQueryClient();

  const toggleTask = useMutation({
    mutationFn: async ({ taskId, isDone }: { taskId: string; isDone: boolean }) => {
      const { error } = await supabase
        .from('daily_task_items')
        .update({ 
          is_done: isDone,
          done_at: isDone ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: { title: string } }) => {
      const { error } = await supabase
        .from('daily_task_items')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
      toast.success('Task updated');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('daily_task_items')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
      toast.success('Task deleted');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const addTask = useMutation({
    mutationFn: async ({ listId, title }: { listId: string; title: string }) => {
      // Get the current max order_index for this list
      const { data: existingTasks } = await supabase
        .from('daily_task_items')
        .select('order_index')
        .eq('list_id', listId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingTasks && existingTasks.length > 0 
        ? existingTasks[0].order_index + 1 
        : 0;

      const { error } = await supabase
        .from('daily_task_items')
        .insert({
          list_id: listId,
          title,
          order_index: nextOrderIndex,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
      toast.success('Task added');
    },
    onError: () => {
      toast.error('Failed to add task');
    },
  });

  return {
    toggleTask,
    updateTask,
    deleteTask,
    addTask,
  };
};
