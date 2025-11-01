import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useListMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createList = useMutation({
    mutationFn: async (data: {
      jobsite_id: string;
      title: string;
      for_date: string;
    }) => {
      if (!user?.companyId || !user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: result, error } = await supabase
        .from('daily_task_lists')
        .insert({
          company_id: user.companyId,
          created_by: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Daily task list created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create list.',
        variant: 'destructive',
      });
    },
  });

  const updateList = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      const { data: result, error } = await supabase
        .from('daily_task_lists')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'List updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update list.',
        variant: 'destructive',
      });
    },
  });

  const closeList = useMutation({
    mutationFn: async (listId: string) => {
      const { data, error } = await supabase
        .from('daily_task_lists')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: user?.id,
        })
        .eq('id', listId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'List closed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close list.',
        variant: 'destructive',
      });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('daily_task_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'List deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['daily-task-lists'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete list.',
        variant: 'destructive',
      });
    },
  });

  return {
    createList,
    updateList,
    closeList,
    deleteList,
  };
};
