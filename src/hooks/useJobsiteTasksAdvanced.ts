import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeyFactory';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TaskTag {
  id: string;
  company_id: string;
  label: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  task_id: string;
  user_id: string;
  assigned_at: string;
  user_profiles: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    trade: string | null;
    position: string | null;
  };
}

export interface SubtaskAssignee {
  subtask_id: string;
  user_id: string;
  assigned_at: string;
  user_profiles: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    trade: string | null;
    position: string | null;
  };
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  sort_order: number;
  created_at: string;
  updated_at: string;
  assignees: SubtaskAssignee[];
  tags: TaskTag[];
}

export interface Task {
  id: string;
  jobsite_id: string;
  company_id: string;
  task_name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  trade: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignees: TaskAssignee[];
  tags: TaskTag[];
  subtasks: Subtask[];
}

export interface TaskFilters {
  startDate?: string;
  endDate?: string;
  priority?: 'low' | 'medium' | 'high';
  trade?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  employeeIds?: string[];
  tagIds?: string[];
}

export interface CreateTaskInput {
  task_name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  trade?: string;
  assigneeIds?: string[];
  tagIds?: string[];
  subtasks?: {
    title: string;
    status?: 'pending' | 'in_progress' | 'completed';
    assigneeIds?: string[];
    tagIds?: string[];
  }[];
}

export interface UpdateTaskInput {
  task_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  trade?: string;
  assigneeIds?: string[];
  tagIds?: string[];
}

// ============================================================================
// QUERY HOOK: Fetch Advanced Tasks with All Relations
// ============================================================================

export const useJobsiteTasksAdvanced = (jobsiteId?: string, filters?: TaskFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.jobsite.tasksAdvanced(jobsiteId || '', filters),
    queryFn: async () => {
      console.log('Fetching advanced tasks for jobsite:', jobsiteId, 'with filters:', filters);
      
      if (!user?.companyId || !jobsiteId) {
        console.log('No company ID or jobsite ID available');
        return [];
      }

      // Build the base query with all relations
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignees:task_assignees(
            task_id,
            user_id,
            assigned_at,
            user_profiles!inner(
              user_id,
              first_name,
              last_name,
              trade,
              position
            )
          ),
          tags:task_tag_links(
            task_tags!inner(
              id,
              company_id,
              label,
              color,
              created_at,
              updated_at
            )
          ),
          subtasks(
            id,
            task_id,
            title,
            status,
            sort_order,
            created_at,
            updated_at,
            assignees:subtask_assignees(
              subtask_id,
              user_id,
              assigned_at,
              user_profiles!inner(
                user_id,
                first_name,
                last_name,
                trade,
                position
              )
            ),
            tags:subtask_tag_links(
              task_tags!inner(
                id,
                company_id,
                label,
                color,
                created_at,
                updated_at
              )
            )
          )
        `)
        .eq('company_id', user.companyId)
        .eq('jobsite_id', jobsiteId)
        .order('start_date', { ascending: true });

      // Apply server-side filters
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.trade) {
        query = query.eq('trade', filters.trade);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching advanced tasks:', error);
        throw error;
      }

      console.log('Raw task data from Supabase:', data);

      // Transform the nested data structure
      const transformedTasks: Task[] = (data || []).map((task: any) => ({
        ...task,
        assignees: task.assignees || [],
        tags: (task.tags || []).map((link: any) => link.task_tags).filter(Boolean),
        subtasks: (task.subtasks || []).map((subtask: any) => ({
          ...subtask,
          assignees: subtask.assignees || [],
          tags: (subtask.tags || []).map((link: any) => link.task_tags).filter(Boolean),
        })).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));

      // Apply client-side filters
      let filteredTasks = transformedTasks;

      if (filters?.employeeIds && filters.employeeIds.length > 0) {
        filteredTasks = filteredTasks.filter(task =>
          task.assignees.some(assignee => filters.employeeIds!.includes(assignee.user_id))
        );
      }

      if (filters?.tagIds && filters.tagIds.length > 0) {
        filteredTasks = filteredTasks.filter(task =>
          task.tags.some(tag => filters.tagIds!.includes(tag.id))
        );
      }

      console.log('Transformed and filtered tasks:', filteredTasks);
      return filteredTasks;
    },
    enabled: !!user?.companyId && !!jobsiteId,
  });
};

// ============================================================================
// QUERY HOOK: Fetch All Task Tags for Company
// ============================================================================

export const useTaskTags = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.jobsite.taskTags(user?.companyId || ''),
    queryFn: async () => {
      console.log('Fetching task tags for company:', user?.companyId);
      
      if (!user?.companyId) {
        console.log('No company ID available');
        return [];
      }

      const { data, error } = await supabase
        .from('task_tags')
        .select('*')
        .eq('company_id', user.companyId)
        .order('label', { ascending: true });
      
      if (error) {
        console.error('Error fetching task tags:', error);
        throw error;
      }
      
      console.log('Fetched task tags:', data);
      return data as TaskTag[];
    },
    enabled: !!user?.companyId,
  });
};

// ============================================================================
// MUTATION HOOKS: Task Actions
// ============================================================================

export const useTaskActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // --------------------------------------------------------------------------
  // CREATE TASK
  // --------------------------------------------------------------------------
  const createTask = useMutation({
    mutationFn: async ({ 
      jobsiteId, 
      taskData 
    }: { 
      jobsiteId: string; 
      taskData: CreateTaskInput;
    }) => {
      console.log('Creating task:', taskData);
      
      if (!user?.companyId || !user?.id) {
        throw new Error('User information is required to create tasks');
      }

      // 1. Insert the main task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          jobsite_id: jobsiteId,
          company_id: user.companyId,
          created_by: user.id,
          task_name: taskData.task_name,
          description: taskData.description || null,
          start_date: taskData.start_date,
          end_date: taskData.end_date,
          status: taskData.status,
          priority: taskData.priority,
          trade: taskData.trade || null,
        })
        .select()
        .single();

      if (taskError || !task) {
        console.error('Error creating task:', taskError);
        throw new Error(taskError?.message || 'Failed to create task');
      }

      console.log('Task created:', task);

      // 2. Insert task assignees if provided
      if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
        const assignees = taskData.assigneeIds.map(userId => ({
          task_id: task.id,
          user_id: userId,
        }));

        const { error: assigneesError } = await supabase
          .from('task_assignees')
          .insert(assignees);

        if (assigneesError) {
          console.error('Error creating task assignees:', assigneesError);
          // Don't throw, just log - task was created successfully
        }
      }

      // 3. Insert task tag links if provided
      if (taskData.tagIds && taskData.tagIds.length > 0) {
        const tagLinks = taskData.tagIds.map(tagId => ({
          task_id: task.id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('task_tag_links')
          .insert(tagLinks);

        if (tagsError) {
          console.error('Error creating task tag links:', tagsError);
          // Don't throw, just log
        }
      }

      // 4. Insert subtasks if provided
      if (taskData.subtasks && taskData.subtasks.length > 0) {
        for (let i = 0; i < taskData.subtasks.length; i++) {
          const subtaskData = taskData.subtasks[i];

          const { data: subtask, error: subtaskError } = await supabase
            .from('subtasks')
            .insert({
              task_id: task.id,
              title: subtaskData.title,
              status: subtaskData.status || 'pending',
              sort_order: i,
            })
            .select()
            .single();

          if (subtaskError || !subtask) {
            console.error('Error creating subtask:', subtaskError);
            continue; // Skip to next subtask
          }

          // 4a. Insert subtask assignees if provided
          if (subtaskData.assigneeIds && subtaskData.assigneeIds.length > 0) {
            const subtaskAssignees = subtaskData.assigneeIds.map(userId => ({
              subtask_id: subtask.id,
              user_id: userId,
            }));

            const { error: subtaskAssigneesError } = await supabase
              .from('subtask_assignees')
              .insert(subtaskAssignees);

            if (subtaskAssigneesError) {
              console.error('Error creating subtask assignees:', subtaskAssigneesError);
            }
          }

          // 4b. Insert subtask tag links if provided
          if (subtaskData.tagIds && subtaskData.tagIds.length > 0) {
            const subtaskTagLinks = subtaskData.tagIds.map(tagId => ({
              subtask_id: subtask.id,
              tag_id: tagId,
            }));

            const { error: subtaskTagsError } = await supabase
              .from('subtask_tag_links')
              .insert(subtaskTagLinks);

            if (subtaskTagsError) {
              console.error('Error creating subtask tag links:', subtaskTagsError);
            }
          }
        }
      }

      console.log('Task creation completed successfully');
      return task;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Task has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      console.error('Error creating task:', error);
      toast({
        title: 'Error Creating Task',
        description: error.message || 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // UPDATE TASK
  // --------------------------------------------------------------------------
  const updateTask = useMutation({
    mutationFn: async ({ 
      taskId, 
      taskData 
    }: { 
      taskId: string; 
      taskData: UpdateTaskInput;
    }) => {
      console.log('Updating task:', taskId, taskData);

      // Build update object from provided fields only
      const updateFields: any = {};
      if (taskData.task_name !== undefined) updateFields.task_name = taskData.task_name;
      if (taskData.description !== undefined) updateFields.description = taskData.description;
      if (taskData.start_date !== undefined) updateFields.start_date = taskData.start_date;
      if (taskData.end_date !== undefined) updateFields.end_date = taskData.end_date;
      if (taskData.status !== undefined) updateFields.status = taskData.status;
      if (taskData.priority !== undefined) updateFields.priority = taskData.priority;
      if (taskData.trade !== undefined) updateFields.trade = taskData.trade;

      // 1. Update the main task if there are fields to update
      if (Object.keys(updateFields).length > 0) {
        const { data, error } = await supabase
          .from('tasks')
          .update(updateFields)
          .eq('id', taskId)
          .select();

        if (error) {
          console.error('Error updating task:', error);
          throw new Error(error.message || 'Failed to update task');
        }
        
        console.log('Task updated:', data);
      }

      // 2. Update assignees if provided (delete + re-insert pattern)
      if (taskData.assigneeIds !== undefined) {
        // Delete existing assignees
        await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', taskId);

        // Insert new assignees
        if (taskData.assigneeIds.length > 0) {
          const assignees = taskData.assigneeIds.map(userId => ({
            task_id: taskId,
            user_id: userId,
          }));

          const { error: assigneesError } = await supabase
            .from('task_assignees')
            .insert(assignees);

          if (assigneesError) {
            console.error('Error updating task assignees:', assigneesError);
          }
        }
      }

      // 3. Update tag links if provided (delete + re-insert pattern)
      if (taskData.tagIds !== undefined) {
        // Delete existing tag links
        await supabase
          .from('task_tag_links')
          .delete()
          .eq('task_id', taskId);

        // Insert new tag links
        if (taskData.tagIds.length > 0) {
          const tagLinks = taskData.tagIds.map(tagId => ({
            task_id: taskId,
            tag_id: tagId,
          }));

          const { error: tagsError } = await supabase
            .from('task_tag_links')
            .insert(tagLinks);

          if (tagsError) {
            console.error('Error updating task tag links:', tagsError);
          }
        }
      }

      console.log('Task update completed successfully');
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Task has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      console.error('Error updating task:', error);
      toast({
        title: 'Error Updating Task',
        description: error.message || 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // DELETE TASK
  // --------------------------------------------------------------------------
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      console.log('Deleting task:', taskId);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        throw new Error(error.message || 'Failed to delete task');
      }

      console.log('Task deleted successfully');
    },
    onSuccess: () => {
      toast({
        title: 'Task Deleted',
        description: 'The task has been successfully removed.',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error Deleting Task',
        description: error.message || 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // TOGGLE TASK STATUS
  // --------------------------------------------------------------------------
  const toggleTaskStatus = useMutation({
    mutationFn: async ({ 
      taskId, 
      status 
    }: { 
      taskId: string; 
      status: 'pending' | 'in_progress' | 'completed';
    }) => {
      console.log('Toggling task status:', taskId, status);

      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) {
        console.error('Error toggling task status:', error);
        throw new Error(error.message || 'Failed to update task status');
      }

      console.log('Task status updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      console.error('Error toggling task status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task status.',
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // TOGGLE SUBTASK STATUS
  // --------------------------------------------------------------------------
  const toggleSubtaskStatus = useMutation({
    mutationFn: async ({ 
      subtaskId, 
      status 
    }: { 
      subtaskId: string; 
      status: 'pending' | 'in_progress' | 'completed';
    }) => {
      console.log('Toggling subtask status:', subtaskId, status);

      const { error } = await supabase
        .from('subtasks')
        .update({ status })
        .eq('id', subtaskId);

      if (error) {
        console.error('Error toggling subtask status:', error);
        throw new Error(error.message || 'Failed to update subtask status');
      }

      console.log('Subtask status updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      console.error('Error toggling subtask status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subtask status.',
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // CREATE TAG
  // --------------------------------------------------------------------------
  const createTag = useMutation({
    mutationFn: async ({ 
      label, 
      color 
    }: { 
      label: string; 
      color: string;
    }) => {
      console.log('Creating tag:', label, color);
      
      if (!user?.companyId) {
        throw new Error('Company ID is required to create tags');
      }

      const { data, error } = await supabase
        .from('task_tags')
        .insert({
          company_id: user.companyId,
          label,
          color,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tag:', error);
        throw new Error(error.message || 'Failed to create tag');
      }

      console.log('Tag created successfully:', data);
      return data as TaskTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error Creating Tag',
        description: error.message || 'Failed to create tag. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleSubtaskStatus,
    createTag,
  };
};
