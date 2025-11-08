import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Calendar, AlertTriangle, Timer, Package, ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isPast, differenceInDays, isToday } from 'date-fns';
import JobsiteTaskCard from '../../admin/jobsite/JobsiteTaskCard';
import JobsiteTaskForm from '../../admin/jobsite/JobsiteTaskForm';
import { ForemanJobsite } from '@/hooks/useForemanJobsites';
import { AdvancedTaskList } from '../../admin/tasks/AdvancedTaskList';
import { AdvancedTaskForm } from '../../admin/tasks/AdvancedTaskForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';

interface ForemanJobsiteProgressCardProps {
  jobsite: ForemanJobsite;
}

const ForemanJobsiteProgressCard: React.FC<ForemanJobsiteProgressCardProps> = ({ jobsite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useJobsiteTasksAdvanced(jobsite.id, {});

  const isForeman = user?.role === 'foreman';

  // Calculate enhanced progress metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  
  // Calculate overdue tasks (not done and past task date)
  const overdueTasks = tasks.filter(task => 
    task.status !== 'done' && task.task_date && isPast(new Date(task.task_date)) && !isToday(new Date(task.task_date))
  ).length;
  
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
    if (totalTasks === 0) return { label: 'Active', variant: 'secondary' as const };
    if (progressPercentage === 100) return { label: 'Completed', variant: 'default' as const };
    if (overdueTasks > 0) return { label: 'Overdue', variant: 'destructive' as const };
    return { label: 'Active', variant: 'secondary' as const };
  };

  const status = getJobsiteStatus();

  return (
    <Card className="shadow-md bg-background rounded-xl border hover:shadow-lg transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg font-semibold">{jobsite.name}</CardTitle>
              <Badge variant={status.variant} className="text-xs px-2 py-1">
                {status.label}
              </Badge>
              {overdueTasks > 0 && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {jobsite.address}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {jobsite.starting_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-green-600" />
                    <span>Started: {formatDate(jobsite.starting_date)}</span>
                  </div>
                )}
                {jobsite.due_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-orange-600" />
                    <span>Due: {formatDate(jobsite.due_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {totalTasks > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{progressPercentage}% Complete</span>
                  {overdueTasks > 0 && (
                    <Badge variant="destructive" className="text-xs px-2 py-1">
                      {overdueTasks} Overdue
                    </Badge>
                  )}
                </div>
                <div className="w-32 bg-muted rounded-full h-2 mb-1">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {completedTasks}/{totalTasks} tasks completed
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-muted rounded-full h-9 w-9 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Enhanced Task Summary */}
            {totalTasks > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-muted-foreground">{totalTasks}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{inProgressTasks}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                {overdueTasks > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{overdueTasks}</div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                )}
              </div>
            )}

            {/* Add Task Button for Foremen */}
            {isForeman && (
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Tasks & Phases</h4>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
            )}

            {/* Task List */}
            <AdvancedTaskList
              jobsiteId={jobsite.id}
              filters={{}}
              isAdmin={isForeman}
            />

            {/* Add Task Dialog */}
            {isForeman && (
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <AdvancedTaskForm
                    jobsiteId={jobsite.id}
                    onCancel={() => setShowAddForm(false)}
                    onSuccess={() => setShowAddForm(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ForemanJobsiteProgressCard;