
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users } from 'lucide-react';
import { useForemanJobsites } from '@/hooks/useForemanJobsites';
import ForemanJobsiteProgressCard from './progress/ForemanJobsiteProgressCard';

const JobsiteProgress = () => {
  const { data: jobsites = [], isLoading, error } = useForemanJobsites();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading assigned jobsites: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">My Assigned Projects</h1>
          <p className="text-muted-foreground">Manage tasks and track progress for your assigned jobsites</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{jobsites.length}</div>
                <div className="text-sm text-muted-foreground">Assigned Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {jobsites.filter(j => j.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {jobsites.filter(j => j.due_date && new Date(j.due_date) < new Date()).length}
                </div>
                <div className="text-sm text-muted-foreground">Approaching Deadline</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading your assigned jobsites...
          </div>
        ) : jobsites.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Assigned Projects</h3>
            <p>You haven't been assigned to any jobsites yet.</p>
            <p className="text-sm">Contact your administrator to get assigned to projects.</p>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg max-w-md mx-auto">
              <p className="text-xs text-muted-foreground">
                Your administrator can assign you to projects through the Admin Panel → Jobsite Management section.
              </p>
            </div>
          </div>
        ) : (
          jobsites.map((jobsite) => (
            <ForemanJobsiteProgressCard 
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
