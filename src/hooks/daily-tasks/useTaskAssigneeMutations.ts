import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useTaskAssigneeMutations = (listId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const assignEmployee = useMutation({
    mutationFn: async (data: { item_id: string; user_id: string }) => {
      const { error } = await supabase
        .from('daily_task_item_assignees')
        .insert({
          item_id: data.item_id,
          user_id: data.user_id,
          assigned_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
      toast({ title: 'Employee assigned successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to assign employee', variant: 'destructive' });
    },
  });

  const unassignEmployee = useMutation({
    mutationFn: async (data: { item_id: string; user_id: string }) => {
      const { error } = await supabase
        .from('daily_task_item_assignees')
        .delete()
        .eq('item_id', data.item_id)
        .eq('user_id', data.user_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
      toast({ title: 'Employee unassigned successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to unassign employee', variant: 'destructive' });
    },
  });

  return {
    assignEmployee,
    unassignEmployee,
  };
};
