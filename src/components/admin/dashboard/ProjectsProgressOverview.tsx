
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useJobsites } from '@/hooks/useJobsites';
import { Calendar, TrendingUp } from 'lucide-react';

const ProjectsProgressOverview = () => {
  const { data: jobsites, isLoading } = useJobsites();

  // Get up to 5 recent jobsites
  const recentJobsites = jobsites?.slice(0, 5) || [];

  // Mock progress calculation - in a real app, this would come from actual progress data
  const getProgressPercentage = (jobsite: any) => {
    // For demo purposes, calculate mock progress based on creation date
    const created = new Date(jobsite.created_at);
    const now = new Date();
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    // Mock progress: 10% per week, capped at 95%
    const mockProgress = Math.min(95, Math.max(5, (daysSinceCreated / 7) * 10));
    return Math.round(mockProgress);
  };

  const getEstimatedCompletion = (jobsite: any) => {
    const progress = getProgressPercentage(jobsite);
    const created = new Date(jobsite.created_at);
    const estimatedDays = Math.round((100 - progress) * 2); // 2 days per percent remaining
    const completionDate = new Date(created.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
    
    return completionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Project Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            Loading projects...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">Project Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {recentJobsites.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No projects in progress
          </div>
        ) : (
          <div className="space-y-4">
            {recentJobsites.map((jobsite) => {
              const progress = getProgressPercentage(jobsite);
              const estimatedCompletion = getEstimatedCompletion(jobsite);
              
              return (
                <div key={jobsite.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{jobsite.name}</h4>
                    <span className="text-sm font-semibold text-gray-700">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Est. completion: {estimatedCompletion}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsProgressOverview;
