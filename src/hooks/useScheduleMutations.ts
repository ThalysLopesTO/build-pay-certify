import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface CreateScheduleTaskData {
  jobsite_id: string;
  task_text: string;
  start_date: string;
  end_date: string;
  progress?: number;
  task_type?: 'task' | 'milestone' | 'summary';
  parent_id?: string | null;
  sort_order?: number;
}

interface UpdateScheduleTaskData {
  id: string;
  task_text?: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  task_type?: 'task' | 'milestone' | 'summary';
  parent_id?: string | null;
  sort_order?: number;
}

export const useCreateScheduleTask = (jobsiteId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateScheduleTaskData) => {
      const { data: result, error } = await supabase
        .from('jobsite_schedule_items')
        .insert({
          ...data,
          company_id: user?.companyId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsite-schedule', jobsiteId] });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    },
  });
};

export const useUpdateScheduleTask = (jobsiteId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateScheduleTaskData) => {
      const { data: result, error } = await supabase
        .from('jobsite_schedule_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsite-schedule', jobsiteId] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    },
  });
};

export const useDeleteScheduleTask = (jobsiteId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('jobsite_schedule_items')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobsite-schedule', jobsiteId] });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    },
  });
};
