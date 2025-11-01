import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { JobsiteTaskOverview } from '@/components/daily-tasks/JobsiteTaskOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobsites } from '@/hooks/useJobsites';
import { ListChecks } from 'lucide-react';

const DailyTasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: jobsites = [] } = useJobsites('active');
  const selectedJobsiteId = searchParams.get('jobsiteId');

  const handleJobsiteChange = (jobsiteId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('jobsiteId', jobsiteId);
    params.delete('listId');
    setSearchParams(params);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ListChecks className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track daily tasks for your jobsites
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Jobsite</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJobsiteId || ''} onValueChange={handleJobsiteChange}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Choose a jobsite..." />
            </SelectTrigger>
            <SelectContent>
              {jobsites.map((jobsite) => (
                <SelectItem key={jobsite.id} value={jobsite.id}>
                  {jobsite.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedJobsiteId && <JobsiteTaskOverview jobsiteId={selectedJobsiteId} />}
    </div>
  );
};

export default DailyTasksPage;
