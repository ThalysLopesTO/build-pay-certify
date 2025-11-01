import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useTaskAssigneeMutations = (listId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const assignEmployee = useMutation({
    mutationFn: async ({ itemId, userId }: { itemId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('daily_task_item_assignees')
        .insert({
          item_id: itemId,
          user_id: userId,
          assigned_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
      toast({
        title: 'Employee assigned',
        description: 'Task has been assigned successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to assign employee:', error);
      toast({
        title: 'Assignment failed',
        description: 'Could not assign employee to task.',
        variant: 'destructive',
      });
    },
  });

  const unassignEmployee = useMutation({
    mutationFn: async ({ itemId, userId }: { itemId: string; userId: string }) => {
      const { error } = await supabase
        .from('daily_task_item_assignees')
        .delete()
        .eq('item_id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
      toast({
        title: 'Employee unassigned',
        description: 'Employee has been removed from task.',
      });
    },
    onError: (error) => {
      console.error('Failed to unassign employee:', error);
      toast({
        title: 'Unassignment failed',
        description: 'Could not remove employee from task.',
        variant: 'destructive',
      });
    },
  });

  return { assignEmployee, unassignEmployee };
};
