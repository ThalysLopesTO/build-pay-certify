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
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        <div className="mb-6">
          <Skeleton className="h-9 w-80 mb-2" />
          <Skeleton className="h-5 w-96 mb-4" />
          <Skeleton className="h-11 w-full max-w-md" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          Project Sites – Daily Tasks
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Select a project to view and manage daily tasks
          {totalJobsites > 0 && ` • ${totalJobsites} active ${totalJobsites === 1 ? 'site' : 'sites'}`}
        </p>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search projects by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11 text-sm rounded-lg border-border focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Jobsite List */}
      <div className="space-y-2">
        {filteredJobsites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-muted-foreground">
              {searchQuery ? 'No jobsites found matching your search' : 'No active jobsites found'}
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

  return (
    <div
      onClick={onClick}
      className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 
                 border border-border rounded-lg bg-card hover:bg-accent/50 
                 hover:shadow-sm transition-all cursor-pointer group"
    >
      {/* Left: Name, Address, Status */}
      <div className="flex-1 min-w-0 w-full md:w-auto">
        <h3 className="font-semibold text-base text-foreground truncate mb-0.5">
          {jobsite.name}
        </h3>
        
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{jobsite.address}</span>
        </div>
        
        <Badge variant="outline" className="text-xs px-2 py-0.5 bg-background">
          Active
        </Badge>
      </div>

      {/* Middle: Progress & Stats */}
      <div className="flex-1 min-w-0 w-full md:w-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Task Progress</span>
          <span className="text-xs font-semibold text-foreground">{completionPercentage}%</span>
        </div>
        
        <Progress value={completionPercentage} className="h-1.5 mb-2" />
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {openTasks} Open
          </span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {completedToday} Done
          </span>
          {overdueTasks > 0 && (
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {overdueTasks} Overdue
            </span>
          )}
        </div>
      </div>

      {/* Right: Button */}
      <div className="flex-shrink-0 w-full md:w-auto">
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-2 hover:bg-accent w-full md:w-auto"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Tasks
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
