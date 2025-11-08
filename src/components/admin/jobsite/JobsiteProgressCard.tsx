
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Calendar, AlertTriangle, Timer, Package, ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useJobsiteTasks } from '@/hooks/useJobsiteTasks';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isPast, differenceInDays, isToday } from 'date-fns';
import JobsiteTaskCard from './JobsiteTaskCard';
import JobsiteTaskForm from './JobsiteTaskForm';
import JobsiteMaterialTakeoff from './JobsiteMaterialTakeoff';
import { AdvancedTaskList } from '../tasks/AdvancedTaskList';
import { AdvancedTaskForm } from '../tasks/AdvancedTaskForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';

interface Jobsite {
  id: string;
  name: string;
  address: string;
  starting_date?: string;
  created_at: string;
}

interface JobsiteProgressCardProps {
  jobsite: Jobsite;
}

const JobsiteProgressCard: React.FC<JobsiteProgressCardProps> = ({ jobsite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useJobsiteTasksAdvanced(jobsite.id, {});

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

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

  const formatStartingDate = (dateString: string) => {
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
    <Card className="shadow-md bg-background rounded-2xl border hover:shadow-lg transition-all">
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
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {jobsite.address}
              </p>
              {jobsite.starting_date && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Started: {formatStartingDate(jobsite.starting_date)}
                </p>
              )}
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600">{totalTasks}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{inProgressTasks}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                {overdueTasks > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{overdueTasks}</div>
                    <div className="text-xs text-gray-500">Overdue</div>
                  </div>
                )}
              </div>
            )}

            {/* Add Task Button for Admins */}
            {isAdmin && (
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
              isAdmin={isAdmin}
            />

            {/* Add Task Dialog */}
            {isAdmin && (
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

            {/* Material Takeoff Section */}
            <div className="mt-4">
              <Collapsible open={showMaterials} onOpenChange={setShowMaterials}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">Material Takeoff</span>
                    </div>
                    {showMaterials ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <JobsiteMaterialTakeoff 
                    jobsiteId={jobsite.id} 
                    jobsiteName={jobsite.name} 
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default JobsiteProgressCard;
