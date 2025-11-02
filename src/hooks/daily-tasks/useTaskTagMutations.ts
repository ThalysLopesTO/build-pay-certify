import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTaskTagMutations = (listId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addTag = useMutation({
    mutationFn: async (data: { item_id: string; tag_text: string }) => {
      const { error } = await supabase
        .from('daily_task_item_tags')
        .insert({
          item_id: data.item_id,
          tag_text: data.tag_text,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add tag', description: error.message, variant: 'destructive' });
    },
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('daily_task_item_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove tag', description: error.message, variant: 'destructive' });
    },
  });

  const updateTags = useMutation({
    mutationFn: async (data: { item_id: string; tags: string[] }) => {
      // Delete existing tags
      const { error: deleteError } = await supabase
        .from('daily_task_item_tags')
        .delete()
        .eq('item_id', data.item_id);

      if (deleteError) throw deleteError;

      // Insert new tags
      if (data.tags.length > 0) {
        const { error: insertError } = await supabase
          .from('daily_task_item_tags')
          .insert(data.tags.map((tag) => ({ item_id: data.item_id, tag_text: tag })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-task-items', listId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update tags', description: error.message, variant: 'destructive' });
    },
  });

  return {
    addTag,
    removeTag,
    updateTags,
  };
};
