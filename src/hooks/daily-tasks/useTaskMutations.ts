import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useTaskMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createTask = useMutation({
    mutationFn: async (data: {
      list_id: string;
      title: string;
      parent_item_id?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string;
      notes?: string;
      order_index?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('daily_task_items')
        .insert({
          created_by: user.id,
          priority: 'medium',
          order_index: 0,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create task.',
        variant: 'destructive',
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      const { data: result, error } = await supabase
        .from('daily_task_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task.',
        variant: 'destructive',
      });
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
      const { data, error } = await supabase
        .from('daily_task_items')
        .update({
          is_done,
          done_at: is_done ? new Date().toISOString() : null,
          done_by: is_done ? user?.id : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task status.',
        variant: 'destructive',
      });
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
      queryClient.invalidateQueries({ queryKey: ['daily-task-items'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete task.',
        variant: 'destructive',
      });
    },
  });

  return {
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
};
