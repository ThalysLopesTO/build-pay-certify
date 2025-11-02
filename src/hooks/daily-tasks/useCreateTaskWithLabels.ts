import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface CreateTaskWithLabelsInput {
  list_id: string;
  title: string;
  priority?: string;
  notes?: string;
  parent_item_id?: string;
  assignee_ids?: string[];
  tags?: string[];
  order_index?: number;
}

export const useCreateTaskWithLabels = (listId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskWithLabelsInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      // 1. Create the task
      const { data: task, error: taskError } = await supabase
        .from('daily_task_items')
        .insert({
          list_id: input.list_id,
          title: input.title,
          priority: input.priority || 'medium',
          notes: input.notes,
          parent_item_id: input.parent_item_id,
          created_by: user.id,
          order_index: input.order_index ?? 0,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // 2. Add assignees if provided
      if (input.assignee_ids && input.assignee_ids.length > 0) {
        const { error: assigneesError } = await supabase
          .from('daily_task_item_assignees')
          .insert(
            input.assignee_ids.map((userId) => ({
              item_id: task.id,
              user_id: userId,
              assigned_by: user.id,
            }))
          );

        if (assigneesError) throw assigneesError;
      }

      // 3. Add tags if provided
      if (input.tags && input.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('daily_task_item_tags')
          .insert(
            input.tags.map((tag) => ({
              item_id: task.id,
              tag_text: tag,
            }))
          );

        if (tagsError) throw tagsError;
      }

      return task;
    },
    onSuccess: () => {
      // Invalidate all task-related queries to ensure immediate updates across all views
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key.includes('daily-task-items') ||
            key.includes('daily-tasks-by-date') ||
            key.includes('daily-task-lists')
          );
        }
      });
      toast({ title: 'Task created successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
