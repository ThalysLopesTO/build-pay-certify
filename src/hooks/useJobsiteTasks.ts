
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface JobsiteTask {
  id: string;
  jobsite_id: string;
  company_id: string;
  task_name: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobsiteTaskInput {
  task_name: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export const useJobsiteTasks = (jobsiteId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['jobsite-tasks', jobsiteId, user?.companyId],
    queryFn: async () => {
      console.log('Fetching tasks for jobsite:', jobsiteId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      let query = supabase
        .from('jobsite_tasks')
        .select('*')
        .eq('company_id', user.companyId)
        .order('start_date', { ascending: true });

      if (jobsiteId) {
        query = query.eq('jobsite_id', jobsiteId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching jobsite tasks:', error);
        throw error;
      }
      
      console.log('Fetched jobsite tasks:', data);
      return data as JobsiteTask[];
    },
    enabled: !!user?.companyId,
  });
};

export const useJobsiteTaskActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addTask = useMutation({
    mutationFn: async ({ jobsiteId, taskData }: { jobsiteId: string; taskData: JobsiteTaskInput }) => {
      console.log('Adding task:', taskData);
      
      if (!user?.companyId || !user?.id) {
        throw new Error('User information is required to add tasks');
      }

      const { data, error } = await supabase
        .from('jobsite_tasks')
        .insert({
          jobsite_id: jobsiteId,
          company_id: user.companyId,
          created_by: user.id,
          ...taskData,
        })
        .select();

      if (error) {
        console.error('Error adding task:', error);
        throw new Error(error.message || 'Failed to add task');
      }
      
      console.log('Task added successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Task has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsite-tasks'] });
    },
    onError: (error) => {
      console.error('Error adding task:', error);
      toast({
        title: 'Error Adding Task',
        description: error.message || 'Failed to add task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: Partial<JobsiteTaskInput> }) => {
      console.log('Updating task:', taskId, taskData);

      const { data, error } = await supabase
        .from('jobsite_tasks')
        .update(taskData)
        .eq('id', taskId)
        .select();

      if (error) {
        console.error('Error updating task:', error);
        throw new Error(error.message || 'Failed to update task');
      }
      
      console.log('Task updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Task has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsite-tasks'] });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast({
        title: 'Error Updating Task',
        description: error.message || 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      console.log('Deleting task:', taskId);

      const { error } = await supabase
        .from('jobsite_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        throw new Error(error.message || 'Failed to delete task');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Task Deleted',
        description: 'The task has been successfully removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['jobsite-tasks'] });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error Deleting Task',
        description: error.message || 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    addTask,
    updateTask,
    deleteTask,
  };
};
