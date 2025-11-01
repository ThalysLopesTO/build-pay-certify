import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { JobsiteSelectionGrid } from '@/components/daily-tasks/JobsiteSelectionGrid';
import { TaskListsView } from '@/components/daily-tasks/TaskListsView';
import { useJobsites } from '@/hooks/useJobsites';
import { ListChecks } from 'lucide-react';

const DailyTasksPage = () => {
  const [searchParams] = useSearchParams();
  const { data: jobsites = [], isLoading } = useJobsites('active');
  const selectedJobsiteId = searchParams.get('jobsiteId');

  const selectedJobsite = selectedJobsiteId 
    ? jobsites.find(j => j.id === selectedJobsiteId) || null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ListChecks className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {selectedJobsiteId 
              ? 'Manage task lists for this jobsite'
              : 'Select a jobsite to view and manage daily tasks'}
          </p>
        </div>
      </div>

      {selectedJobsiteId ? (
        <TaskListsView jobsite={selectedJobsite} jobsiteId={selectedJobsiteId} />
      ) : (
        <JobsiteSelectionGrid jobsites={jobsites} isLoading={isLoading} />
      )}
    </div>
  );
};

export default DailyTasksPage;
