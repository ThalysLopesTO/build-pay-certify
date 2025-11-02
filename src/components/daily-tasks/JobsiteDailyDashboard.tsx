import React from 'react';
import { DailyTasksSummaryCards } from './DailyTasksSummaryCards';
import { DailyTaskListView } from './DailyTaskListView';
import { useJobsiteDashboardStats } from '@/hooks/daily-tasks/useJobsiteDashboardStats';

interface JobsiteDailyDashboardProps {
  jobsiteId: string;
  companyId: string;
}

export const JobsiteDailyDashboard: React.FC<JobsiteDailyDashboardProps> = ({
  jobsiteId,
  companyId,
}) => {
  const { data: stats, isLoading: statsLoading } = useJobsiteDashboardStats(jobsiteId, companyId);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <DailyTasksSummaryCards
        totalTasks={stats?.totalTasks || 0}
        completedTasks={stats?.completedTasks || 0}
        incompleteTasks={stats?.incompleteTasks || 0}
        completionPercentage={stats?.completionPercentage || 0}
        isLoading={statsLoading}
      />

      {/* Task Lists */}
      <DailyTaskListView jobsiteId={jobsiteId} companyId={companyId} />
    </div>
  );
};
