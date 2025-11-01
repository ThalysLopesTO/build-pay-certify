import React from 'react';
import { TaskListView } from './TaskListView';
import { useAllJobsiteTasks } from '@/hooks/daily-tasks/useAllJobsiteTasks';
import { useTaskMutations } from '@/hooks/daily-tasks/useTaskMutations';
import { Loader2, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobsiteTaskOverviewProps {
  jobsiteId: string;
}

export const JobsiteTaskOverview: React.FC<JobsiteTaskOverviewProps> = ({
  jobsiteId,
}) => {
  const { data: tasks = [], isLoading } = useAllJobsiteTasks(jobsiteId);
  const { toast } = useToast();

  // Use the first list's ID for mutations (or create a global mutation hook)
  const firstListId = tasks.length > 0 ? tasks[0].list_id : '';
  const { toggleComplete, updateTask, deleteTask, createTask } = useTaskMutations(firstListId);

  const handleToggle = (id: string, isDone: boolean) => {
    toggleComplete.mutate({ id, is_done: isDone });
  };

  const handleUpdate = (id: string, updates: { title: string }) => {
    updateTask.mutate({ id, updates });
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id);
  };

  const handleAdd = (title: string, listId: string) => {
    createTask.mutate({ title, list_id: listId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No tasks have been created for this jobsite yet. Create a task list to get started!
        </p>
      </div>
    );
  }

  return (
    <TaskListView
      tasks={tasks}
      onToggle={handleToggle}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onAdd={handleAdd}
      isLoading={isLoading}
    />
  );
};
