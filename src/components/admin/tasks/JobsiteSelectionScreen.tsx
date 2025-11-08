import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Search, ChevronRight, ListTodo } from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import { useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';
import { format, isPast, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function JobsiteSelectionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: jobsites = [], isLoading } = useJobsites('active');

  // Filter jobsites based on search
  const filteredJobsites = jobsites.filter((jobsite) =>
    jobsite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jobsite.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Select Jobsite</h1>
        <p className="text-muted-foreground">Choose a jobsite to view and manage daily tasks</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Jobsite List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobsites.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <ListTodo className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Jobsites Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search query' : 'No active jobsites available'}
            </p>
          </div>
        ) : (
          filteredJobsites.map((jobsite) => (
            <JobsiteCard
              key={jobsite.id}
              jobsite={jobsite}
              onClick={() => navigate(`/admin/tasks/${jobsite.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface JobsiteCardProps {
  jobsite: {
    id: string;
    name: string;
    address: string;
  };
  onClick: () => void;
}

function JobsiteCard({ jobsite, onClick }: JobsiteCardProps) {
  const { data: tasks = [] } = useJobsiteTasksAdvanced(jobsite.id, {
    taskDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const allTasksToday = tasks;
  const openTasks = allTasksToday.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const completedToday = allTasksToday.filter((t) => t.status === 'done').length;
  const overdueTasks = allTasksToday.filter((t) => {
    if (t.status === 'done' || !t.task_date) return false;
    const taskDate = new Date(t.task_date);
    return isPast(taskDate) && !isToday(taskDate);
  }).length;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {jobsite.name}
            </h3>
            <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{jobsite.address}</span>
            </div>
          </div>

          {/* Task Stats */}
          <div className="flex items-center gap-3 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-medium text-foreground">{openTasks}</span>
              <span className="text-muted-foreground">open</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-medium text-foreground">{completedToday}</span>
              <span className="text-muted-foreground">done</span>
            </div>
            {overdueTasks > 0 && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="font-medium text-destructive">{overdueTasks}</span>
                  <span className="text-muted-foreground">overdue</span>
                </div>
              </>
            )}
          </div>

          {/* View Button */}
          <Button
            variant="outline"
            className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            View Tasks
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
