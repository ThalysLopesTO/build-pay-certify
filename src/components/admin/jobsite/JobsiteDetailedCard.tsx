import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, MapPin, BarChart3, Package, ClipboardList } from 'lucide-react';
import { useJobsiteActions } from '@/hooks/useJobsiteActions';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';
import JobsiteTaskCard from './JobsiteTaskCard';
import JobsiteMaterialTakeoff from './JobsiteMaterialTakeoff';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  due_date?: string;
  created_at: string;
}

interface JobsiteDetailedCardProps {
  jobsite: Jobsite;
}

const JobsiteDetailedCard: React.FC<JobsiteDetailedCardProps> = ({ jobsite }) => {
  const { deleteJobsite } = useJobsiteActions();
  const { data: tasks = [], isLoading: tasksLoading } = useJobsiteTasks(jobsite.id);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${jobsite.name}"? This action cannot be undone.`)) {
      try {
        await deleteJobsite.mutateAsync(jobsite.id);
      } catch (error) {
        console.error('Error deleting jobsite:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getJobsiteStatus = () => {
    if (!jobsite.due_date) return { label: 'Active', variant: 'secondary' as const };
    
    const dueDate = new Date(jobsite.due_date);
    const today = new Date();
    
    if (dueDate < today) {
      return { label: 'Overdue', variant: 'destructive' as const };
    } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { label: 'Due Soon', variant: 'secondary' as const };
    } else {
      return { label: 'Active', variant: 'secondary' as const };
    }
  };

  const status = getJobsiteStatus();
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{jobsite.name}</CardTitle>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {jobsite.address}
              </p>
              {jobsite.starting_date && (
                <p className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Started: {formatDate(jobsite.starting_date)}
                </p>
              )}
              {jobsite.due_date && (
                <p className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Due: {formatDate(jobsite.due_date)}
                </p>
              )}
              <p className="flex items-center">
                <BarChart3 className="h-3 w-3 mr-1" />
                Progress: {progressPercentage.toFixed(0)}% ({completedTasks}/{totalTasks} tasks)
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteJobsite.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Material Takeoff
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks ({totalTasks})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-4">
            <JobsiteMaterialTakeoff 
              jobsiteId={jobsite.id} 
              jobsiteName={jobsite.name} 
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-3">
              {tasksLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks created for this jobsite yet.
                </div>
              ) : (
                tasks.map((task) => (
                  <JobsiteTaskCard key={task.id} task={task} isAdmin={true} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JobsiteDetailedCard;