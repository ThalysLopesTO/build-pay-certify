import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, ArrowRight } from 'lucide-react';
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
    if (progress >= 30) return 'bg-orange-500'; 
    return 'bg-red-500';
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-100';
    if (progress >= 30) return 'bg-orange-100'; 
    return 'bg-red-100';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-600">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Job Progress</h3>
              <p className="text-sm text-muted-foreground">Active projects</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : activeJobsites.length > 0 ? (
          activeJobsites.slice(0, 3).map((jobsite) => (
            <div key={jobsite.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {jobsite.name}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {jobsite.progress}%
                </span>
              </div>
              <div className={`w-full h-3 rounded-full ${getProgressBgColor(jobsite.progress)}`}>
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(jobsite.progress)}`}
                  style={{ width: `${jobsite.progress}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No active jobsites</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobProgressCard;