import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeyFactory';
import { format, addDays } from 'date-fns';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TaskTag {
  id: string;
  company_id: string;
  label: string;
  color: string;
  created_at: string;
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
  notes: string | null;
  due_time: string | null;
  status: 'pending' | 'in_progress' | 'done';
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
  title: string;
  description: string | null;
  task_date: string; // YYYY-MM-DD
  due_time: string | null; // HH:MM:SS or null
  status: 'pending' | 'in_progress' | 'done';
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
  taskDate?: string; // filter by specific date YYYY-MM-DD
  dateRange?: { start: string; end: string }; // for CSV export
  priority?: 'low' | 'medium' | 'high';
  trade?: string;
  status?: 'pending' | 'in_progress' | 'done';
  assigneeIds?: string[];
  tagIds?: string[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  task_date: string; // YYYY-MM-DD
  due_time?: string; // HH:MM or HH:MM:SS
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  trade?: string;
  assigneeIds?: string[];
  tagIds?: string[];
  subtasks?: {
    title: string;
    notes?: string;
    due_time?: string;
    status?: 'pending' | 'in_progress' | 'done';
    assigneeIds?: string[];
    tagIds?: string[];
  }[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  task_date?: string;
  due_time?: string;
  status?: 'pending' | 'in_progress' | 'done';
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
              created_at
            )
          ),
          subtasks(
            id,
            task_id,
            title,
            notes,
            due_time,
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
                created_at
              )
            )
          )
        `)
        .eq('company_id', user.companyId)
        .eq('jobsite_id', jobsiteId)
        .order('task_date', { ascending: true });

      // Apply server-side filters
      if (filters?.taskDate) {
        query = query.eq('task_date', filters.taskDate);
      }
      if (filters?.dateRange) {
        query = query.gte('task_date', filters.dateRange.start)
                    .lte('task_date', filters.dateRange.end);
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

      if (filters?.assigneeIds && filters.assigneeIds.length > 0) {
        filteredTasks = filteredTasks.filter(task =>
          task.assignees.some(assignee => filters.assigneeIds!.includes(assignee.user_id))
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
        .order('label', { ascending: true});

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
          title: taskData.title,
          description: taskData.description || null,
          task_date: taskData.task_date,
          due_time: taskData.due_time || null,
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
              notes: subtaskData.notes || null,
              due_time: subtaskData.due_time || null,
              status: subtaskData.status || 'pending',
              sort_order: i,
            })
            .select()
            .single();

          if (subtaskError || !subtask) {
            console.error('Error creating subtask:', subtaskError);
            continue;
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
  // BULK UPDATE TASKS
  // --------------------------------------------------------------------------
  const bulkUpdateTasks = useMutation({
    mutationFn: async ({ 
      taskIds, 
      taskData 
    }: { 
      taskIds: string[]; 
      taskData: UpdateTaskInput;
    }) => {
      console.log('Bulk updating tasks:', taskIds, taskData);

      // Build update object from provided fields only
      const updateFields: any = {};
      if (taskData.title !== undefined) updateFields.title = taskData.title;
      if (taskData.description !== undefined) updateFields.description = taskData.description;
      if (taskData.task_date !== undefined) updateFields.task_date = taskData.task_date;
      if (taskData.due_time !== undefined) updateFields.due_time = taskData.due_time;
      if (taskData.status !== undefined) updateFields.status = taskData.status;
      if (taskData.priority !== undefined) updateFields.priority = taskData.priority;
      if (taskData.trade !== undefined) updateFields.trade = taskData.trade;

      if (Object.keys(updateFields).length === 0) {
        throw new Error('No fields to update');
      }

      // Supabase allows batch update using .in() filter
      const { data, error } = await supabase
        .from('tasks')
        .update(updateFields)
        .in('id', taskIds)
        .select();

      if (error) {
        console.error('Error bulk updating tasks:', error);
        throw new Error(error.message || 'Failed to update tasks');
      }
      
      console.log('Tasks bulk updated:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success!',
        description: `${variables.taskIds.length} task(s) updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      console.error('Error bulk updating tasks:', error);
      toast({
        title: 'Error Updating Tasks',
        description: error.message || 'Failed to update tasks. Please try again.',
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
      if (taskData.title !== undefined) updateFields.title = taskData.title;
      if (taskData.description !== undefined) updateFields.description = taskData.description;
      if (taskData.task_date !== undefined) updateFields.task_date = taskData.task_date;
      if (taskData.due_time !== undefined) updateFields.due_time = taskData.due_time;
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
      return taskId;
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
      return taskId;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Task has been deleted successfully.',
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
  // DUPLICATE TASK TO DATE
  // --------------------------------------------------------------------------
  const duplicateTaskToDate = useMutation({
    mutationFn: async ({ taskId, newDate }: { taskId: string; newDate: string }) => {
      console.log('Duplicating task to date:', taskId, newDate);

      if (!user?.companyId || !user?.id) {
        throw new Error('User information is required');
      }

      // 1. Fetch original task with all relations
      const { data: originalTask, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignees:task_assignees(user_id),
          tags:task_tag_links(tag_id),
          subtasks(
            title,
            notes,
            due_time,
            status,
            sort_order,
            assignees:subtask_assignees(user_id),
            tags:subtask_tag_links(tag_id)
          )
        `)
        .eq('id', taskId)
        .single();

      if (fetchError || !originalTask) {
        throw new Error('Failed to fetch original task');
      }

      // 2. Create new task with same data but new task_date
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          jobsite_id: originalTask.jobsite_id,
          company_id: user.companyId,
          created_by: user.id,
          title: originalTask.title,
          description: originalTask.description,
          task_date: newDate,
          due_time: originalTask.due_time,
          status: 'pending', // Reset to pending
          priority: originalTask.priority,
          trade: originalTask.trade,
        })
        .select()
        .single();

      if (taskError || !newTask) {
        throw new Error('Failed to create duplicate task');
      }

      // 3. Copy assignees
      if (originalTask.assignees && originalTask.assignees.length > 0) {
        const assignees = originalTask.assignees.map((a: any) => ({
          task_id: newTask.id,
          user_id: a.user_id,
        }));
        await supabase.from('task_assignees').insert(assignees);
      }

      // 4. Copy tags
      if (originalTask.tags && originalTask.tags.length > 0) {
        const tagLinks = originalTask.tags.map((t: any) => ({
          task_id: newTask.id,
          tag_id: t.tag_id,
        }));
        await supabase.from('task_tag_links').insert(tagLinks);
      }

      // 5. Copy subtasks with their assignees and tags
      if (originalTask.subtasks && originalTask.subtasks.length > 0) {
        for (const subtask of originalTask.subtasks) {
          const { data: newSubtask } = await supabase
            .from('subtasks')
            .insert({
              task_id: newTask.id,
              title: subtask.title,
              notes: subtask.notes,
              due_time: subtask.due_time,
              status: 'pending', // Reset to pending
              sort_order: subtask.sort_order,
            })
            .select()
            .single();

          if (newSubtask && subtask.assignees && subtask.assignees.length > 0) {
            const subtaskAssignees = subtask.assignees.map((a: any) => ({
              subtask_id: newSubtask.id,
              user_id: a.user_id,
            }));
            await supabase.from('subtask_assignees').insert(subtaskAssignees);
          }

          if (newSubtask && subtask.tags && subtask.tags.length > 0) {
            const subtaskTags = subtask.tags.map((t: any) => ({
              subtask_id: newSubtask.id,
              tag_id: t.tag_id,
            }));
            await supabase.from('subtask_tag_links').insert(subtaskTags);
          }
        }
      }

      return newTask;
    },
    onSuccess: () => {
      toast({
        title: 'Task Duplicated',
        description: 'Task has been duplicated to the selected date.',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Duplicating Task',
        description: error.message || 'Failed to duplicate task.',
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // MOVE TASK TO TOMORROW
  // --------------------------------------------------------------------------
  const moveTaskToTomorrow = useMutation({
    mutationFn: async ({ taskId, currentDate }: { taskId: string; currentDate: string }) => {
      const tomorrow = addDays(new Date(currentDate), 1);
      const newDate = format(tomorrow, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('tasks')
        .update({ task_date: newDate })
        .eq('id', taskId);

      if (error) {
        throw new Error('Failed to move task to tomorrow');
      }

      return { taskId, newDate };
    },
    onSuccess: () => {
      toast({
        title: 'Task Moved',
        description: 'Task has been moved to tomorrow.',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Moving Task',
        description: error.message || 'Failed to move task.',
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // BULK COMPLETE SUBTASKS
  // --------------------------------------------------------------------------
  const bulkCompleteSubtasks = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('subtasks')
        .update({ status: 'done' })
        .eq('task_id', taskId)
        .neq('status', 'done');

      if (error) {
        throw new Error('Failed to complete subtasks');
      }

      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsite.all });
    },
  });

  return {
    createTask,
    updateTask,
    bulkUpdateTasks,
    deleteTask,
    duplicateTaskToDate,
    moveTaskToTomorrow,
    bulkCompleteSubtasks,
  };
};
