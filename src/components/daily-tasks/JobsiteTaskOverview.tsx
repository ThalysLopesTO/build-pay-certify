import React from 'react';
import { TaskListContainer } from './TaskListContainer';
import { useDailyTaskLists } from '@/hooks/daily-tasks/useDailyTaskLists';
import { Loader2, Inbox } from 'lucide-react';

interface JobsiteTaskOverviewProps {
  jobsiteId: string;
}

export const JobsiteTaskOverview: React.FC<JobsiteTaskOverviewProps> = ({
  jobsiteId,
}) => {
  const { data: lists = [], isLoading } = useDailyTaskLists(jobsiteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Task Lists</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No daily task lists have been created for this jobsite yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {lists.map((list) => (
        <TaskListContainer key={list.id} list={list} />
      ))}
    </div>
  );
};
