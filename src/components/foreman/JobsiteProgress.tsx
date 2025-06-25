
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import JobsiteProgressCard from '../admin/jobsite/JobsiteProgressCard';

const JobsiteProgress = () => {
  const { data: jobsites = [], isLoading, error } = useJobsites();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading jobsites: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">Jobsite Progress</h1>
          <p className="text-gray-600">View progress and tasks for all jobsites</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading jobsites...
          </div>
        ) : jobsites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No jobsites available. Contact your administrator to add jobsites.
          </div>
        ) : (
          jobsites.map((jobsite) => (
            <JobsiteProgressCard 
              key={jobsite.id} 
              jobsite={jobsite}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default JobsiteProgress;
