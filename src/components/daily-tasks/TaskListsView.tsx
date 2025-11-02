import React from 'react';
import { JobsiteContextHeader } from './JobsiteContextHeader';
import { JobsiteDailyDashboard } from './JobsiteDailyDashboard';
import { useAuth } from '@/contexts/SupabaseAuthContext';

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
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  return (
    <div className="space-y-6">
      <JobsiteContextHeader jobsite={jobsite} />
      <JobsiteDailyDashboard jobsiteId={jobsiteId} companyId={companyId} />
    </div>
  );
};
