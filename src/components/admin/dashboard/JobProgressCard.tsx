import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building } from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';

const JobProgressCard: React.FC = () => {
  const { data: jobsites, isLoading } = useJobsites();

  // Get top 3 active jobsites (mock progress for now)
  const activeJobsites = jobsites?.slice(0, 3).map((jobsite, index) => ({
    ...jobsite,
    progress: [75, 45, 20][index] || 50 // Mock progress values
  })) || [];

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-orange-500'; 
    return 'bg-red-500';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building className="h-5 w-5 text-purple-600" />
          Job Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : activeJobsites.length > 0 ? (
          activeJobsites.map((jobsite) => (
            <div key={jobsite.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground truncate">
                  {jobsite.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {jobsite.progress}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={jobsite.progress} 
                  className="h-2"
                />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(jobsite.progress)}`}
                  style={{ width: `${jobsite.progress}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No active jobsites</div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobProgressCard;