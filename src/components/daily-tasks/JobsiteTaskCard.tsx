import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ListChecks, CheckCircle2 } from 'lucide-react';
import { useJobsiteTaskStats } from '@/hooks/daily-tasks/useJobsiteTaskStats';
import { Skeleton } from '@/components/ui/skeleton';

interface JobsiteTaskCardProps {
  jobsite: {
    id: string;
    name: string;
    address: string;
    status: string;
  };
  onClick: () => void;
}

export const JobsiteTaskCard: React.FC<JobsiteTaskCardProps> = ({ jobsite, onClick }) => {
  const { data: stats, isLoading } = useJobsiteTaskStats(jobsite.id);

  const completionPercentage = stats && stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 shrink-0">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate mb-1">
              {jobsite.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mb-4">
              {jobsite.address}
            </p>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {stats?.totalLists || 0} {stats?.totalLists === 1 ? 'list' : 'lists'}
                  </span>
                </div>
                
                {stats && stats.totalTasks > 0 ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {stats.completedTasks} / {stats.totalTasks} tasks completed
                    </span>
                    <span className="ml-auto text-xs font-medium text-primary">
                      {completionPercentage}%
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
