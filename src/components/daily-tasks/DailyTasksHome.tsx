import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useJobsites } from '@/hooks/useJobsites';
import { useDailyTaskLists } from '@/hooks/daily-tasks/useDailyTaskLists';
import { useDailyTaskItems } from '@/hooks/daily-tasks/useDailyTaskItems';
import { useTaskProgress } from '@/hooks/daily-tasks/useTaskProgress';
import { CheckCircle2, ListChecks, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const DailyTasksHome = () => {
  const navigate = useNavigate();
  const { data: jobsites, isLoading: jobsitesLoading } = useJobsites();
  const { data: allLists, isLoading: listsLoading } = useDailyTaskLists();

  const jobsitesSummary = useMemo(() => {
    if (!jobsites || !allLists) return [];

    const today = format(new Date(), 'yyyy-MM-dd');

    return jobsites
      .filter(j => j.status === 'active')
      .map(jobsite => {
        const jobsiteLists = allLists.filter(list => list.jobsite_id === jobsite.id);
        const openLists = jobsiteLists.filter(list => list.status === 'open');
        const todayLists = jobsiteLists.filter(list => list.for_date === today);

        return {
          jobsite,
          openListsCount: openLists.length,
          todayListsCount: todayLists.length,
        };
      });
  }, [jobsites, allLists]);

  if (jobsitesLoading || listsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListChecks className="h-8 w-8" />
            Daily Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage daily task checklists organized by jobsite
          </p>
        </div>
      </div>

      {jobsitesSummary.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Jobsites</h3>
            <p className="text-muted-foreground text-center">
              Create an active jobsite to start managing daily tasks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobsitesSummary.map(({ jobsite, openListsCount, todayListsCount }) => (
            <Card 
              key={jobsite.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer h-full"
              onClick={() => navigate(`/admin/dashboard?tab=daily-tasks&jobsiteId=${jobsite.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="flex-1">{jobsite.name}</span>
                  {todayListsCount > 0 && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                  )}
                </CardTitle>
                {jobsite.address && (
                  <CardDescription className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3" />
                    {jobsite.address}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Open Lists</span>
                    <span className="font-semibold">{openListsCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Today's Lists</span>
                    <span className="font-semibold">{todayListsCount}</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  View Lists
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
