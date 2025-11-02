import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useTaskCommentMutations = (listId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const addComment = useMutation({
    mutationFn: async (data: { body: string; item_id?: string }) => {
      const { error } = await supabase
        .from('daily_task_comments')
        .insert({
          list_id: listId,
          item_id: data.item_id || null,
          author_id: user?.id,
          body: data.body,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', listId] });
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists-paginated'] });
      toast({ title: 'Comment added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    },
  });

  const updateComment = useMutation({
    mutationFn: async (data: { id: string; body: string }) => {
      const { error } = await supabase
        .from('daily_task_comments')
        .update({ body: data.body })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', listId] });
      toast({ title: 'Comment updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update comment', variant: 'destructive' });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('daily_task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', listId] });
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists-paginated'] });
      toast({ title: 'Comment deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    },
  });

  return {
    addComment,
    updateComment,
    deleteComment,
  };
};
