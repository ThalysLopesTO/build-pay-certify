import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Search, ListTodo, Building2, ArrowRight, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import { useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';
import { format, isPast, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export function JobsiteSelectionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: jobsites = [], isLoading } = useJobsites('active');

  // Filter jobsites based on search
  const filteredJobsites = jobsites.filter((jobsite) =>
    jobsite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jobsite.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalJobsites = filteredJobsites.length;

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Project Sites</h1>
        <p className="text-base text-muted-foreground">
          {totalJobsites} {totalJobsites === 1 ? 'active site' : 'active sites'} • Select a project to manage daily tasks
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search projects by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-10 h-14 rounded-xl border-2 focus:border-primary transition-colors text-base"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Jobsite List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredJobsites.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <ListTodo className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Projects Found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery ? 'Try adjusting your search query to find projects' : 'No active project sites available at the moment'}
            </p>
          </div>
        ) : (
          filteredJobsites.map((jobsite) => (
            <JobsiteCard
              key={jobsite.id}
              jobsite={jobsite}
              isMobile={isMobile}
              onClick={() => navigate(`/admin/dashboard?tab=tasks&jobsite=${jobsite.id}`)}
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
  isMobile: boolean;
  onClick: () => void;
}

function JobsiteCard({ jobsite, isMobile, onClick }: JobsiteCardProps) {
  const { data: tasks = [] } = useJobsiteTasksAdvanced(jobsite.id, {
    taskDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const allTasksToday = tasks;
  const totalTasks = allTasksToday.length;
  const openTasks = allTasksToday.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const completedToday = allTasksToday.filter((t) => t.status === 'done').length;
  const overdueTasks = allTasksToday.filter((t) => {
    if (t.status === 'done' || !t.task_date) return false;
    const taskDate = new Date(t.task_date);
    return isPast(taskDate) && !isToday(taskDate);
  }).length;

  // Calculate completion percentage
  const completionPercentage = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

  // Determine border color based on status
  const getBorderColor = () => {
    if (overdueTasks > 0) return 'border-l-red-500';
    if (openTasks > 0) return 'border-l-orange-500';
    return 'border-l-green-500';
  };

  return (
    <Card 
      className={`group relative overflow-hidden border-l-4 ${getBorderColor()} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/50`}
      onClick={onClick}
    >
      <CardContent className={isMobile ? 'p-5' : 'p-6'}>
        <div className="space-y-4">
          {/* Icon/Avatar & Status Badge */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              Active
            </Badge>
          </div>

          {/* Title & Address */}
          <div>
            <h3 className="font-bold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {jobsite.name}
            </h3>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{jobsite.address}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-muted-foreground">Task Progress</span>
                <span className="text-xs font-bold text-foreground">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}

          {/* Task Stats - Redesigned as Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <span className="font-semibold">{openTasks}</span>
              <span className="ml-1 font-normal">Open</span>
            </Badge>
            
            <Badge variant="secondary" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 px-3 py-1">
              <CheckCircle2 className="w-3 h-3 mr-1.5" />
              <span className="font-semibold">{completedToday}</span>
              <span className="ml-1 font-normal">Done</span>
            </Badge>
            
            {overdueTasks > 0 && (
              <Badge variant="secondary" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 px-3 py-1">
                <AlertCircle className="w-3 h-3 mr-1.5" />
                <span className="font-semibold">{overdueTasks}</span>
                <span className="ml-1 font-normal">Overdue</span>
              </Badge>
            )}
          </div>

          {/* View Button - More Prominent */}
          <Button 
            className="w-full justify-between bg-primary hover:bg-primary/90 text-primary-foreground shadow-md group-hover:shadow-lg transition-all h-11"
          >
            <span className="font-medium">View Tasks</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
