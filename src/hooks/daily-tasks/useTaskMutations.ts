import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTaskMutations = (listId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTask = useMutation({
    mutationFn: async (data: { title: string; list_id: string }) => {
      const { data: result, error } = await supabase
        .from('daily_task_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
      toast({ title: 'Task created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create task', variant: 'destructive' });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<any> }) => {
      const { error } = await supabase
        .from('daily_task_items')
        .update(data.updates)
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
    },
    onError: () => {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async (data: { id: string; is_done: boolean }) => {
      const { error } = await supabase
        .from('daily_task_items')
        .update({
          is_done: data.is_done,
          done_at: data.is_done ? new Date().toISOString() : null,
          done_by: data.is_done ? (await supabase.auth.getUser()).data.user?.id : null,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
    },
    onError: () => {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_task_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
      toast({ title: 'Task deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    },
  });

  return {
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
  };
};
