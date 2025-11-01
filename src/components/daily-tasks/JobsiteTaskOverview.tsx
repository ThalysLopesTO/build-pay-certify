import React from 'react';
import { TaskListView } from './TaskListView';
import { useAllJobsiteTasks } from '@/hooks/daily-tasks/useAllJobsiteTasks';
import { useTaskMutations } from '@/hooks/daily-tasks/useTaskMutations';
import { Loader2, Inbox, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface JobsiteTaskOverviewProps {
  jobsiteId: string;
}

export const JobsiteTaskOverview: React.FC<JobsiteTaskOverviewProps> = ({
  jobsiteId,
}) => {
  const { data: tasks = [], isLoading } = useAllJobsiteTasks(jobsiteId);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  if (tasks.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Task Lists Found</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Create your first task list to start organizing work for this jobsite.
        </p>
        <Button onClick={() => navigate(`/daily-tasks?jobsite=${jobsiteId}`)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task List
        </Button>
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
