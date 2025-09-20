import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, CheckCircle, Clock, BarChart3 } from 'lucide-react';

interface Jobsite {
  id: string;
  status: string;
}

interface JobsiteStatsOverviewProps {
  jobsites: Jobsite[];
  isLoading: boolean;
}

const JobsiteStatsOverview: React.FC<JobsiteStatsOverviewProps> = ({ jobsites, isLoading }) => {
  const totalJobsites = jobsites.length;
  const activeJobsites = jobsites.filter(j => j.status === 'active').length;
  const completedJobsites = jobsites.filter(j => j.status === 'completed').length;
  const completionRate = totalJobsites > 0 ? Math.round((completedJobsites / totalJobsites) * 100) : 0;

  const stats = [
    {
      label: 'Total Jobsites',
      value: isLoading ? '--' : totalJobsites.toString(),
      icon: Building,
      className: 'text-primary'
    },
    {
      label: 'Active',
      value: isLoading ? '--' : activeJobsites.toString(),
      icon: Clock,
      className: 'text-blue-600'
    },
    {
      label: 'Completed',
      value: isLoading ? '--' : completedJobsites.toString(),
      icon: CheckCircle,
      className: 'text-green-600'
    },
    {
      label: 'Completion Rate',
      value: isLoading ? '--' : `${completionRate}%`,
      icon: BarChart3,
      className: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${isLoading ? 'animate-pulse' : ''}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-full bg-muted ${stat.className}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobsiteStatsOverview;