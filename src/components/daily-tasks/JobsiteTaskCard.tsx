import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ListChecks, CheckCircle2, ChevronRight } from 'lucide-react';
import { useJobsiteTaskStats } from '@/hooks/daily-tasks/useJobsiteTaskStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
      className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 border-l-4 border-l-transparent hover:border-l-primary"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-foreground truncate mb-1">
                  {jobsite.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {jobsite.address}
                </p>
              </div>
            </div>
            
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>

          {/* Stats */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  <span>
                    {stats?.totalLists || 0} {stats?.totalLists === 1 ? 'list' : 'lists'}
                  </span>
                </div>
                
                {stats && stats.totalTasks > 0 && (
                  <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-xs">
                    {stats.completedTasks}/{stats.totalTasks} tasks
                  </Badge>
                )}
              </div>
              
              {stats && stats.totalTasks > 0 ? (
                <div className="space-y-2">
                  <Progress value={completionPercentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{completionPercentage}% complete</span>
                    {stats.completedTasks === stats.totalTasks && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No tasks yet</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
