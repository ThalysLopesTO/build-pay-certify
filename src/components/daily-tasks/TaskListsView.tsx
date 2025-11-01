import React from 'react';
import { JobsiteContextHeader } from './JobsiteContextHeader';
import { JobsiteTaskOverview } from './JobsiteTaskOverview';

interface TaskListsViewProps {
  jobsite: {
    id: string;
    name: string;
    address: string;
    status: string;
  } | null;
  jobsiteId: string;
}

export const TaskListsView: React.FC<TaskListsViewProps> = ({ jobsite, jobsiteId }) => {
  return (
    <div className="space-y-6">
      <JobsiteContextHeader jobsite={jobsite} />
      <JobsiteTaskOverview jobsiteId={jobsiteId} />
    </div>
  );
};
