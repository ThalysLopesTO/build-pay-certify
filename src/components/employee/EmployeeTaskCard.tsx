import { useState } from 'react';
import { Task, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, CheckCircle2, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatInCompanyTimezone, DEFAULT_TIMEZONE } from '@/utils/timezone';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmployeeTaskCardProps {
  task: Task;
  jobsiteName?: string;
}

const priorityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
};

export function EmployeeTaskCard({ task, jobsiteName }: EmployeeTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const { updateTask } = useTaskActions();
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const companyTimezone = settings?.timezone || DEFAULT_TIMEZONE;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  // Calculate overdue status
  const todayInCompanyTZ = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);
  const isOverdue = task.task_date && task.task_date < todayInCompanyTZ && task.status !== 'done';

  // Check if user is assigned to this task
  const isAssignedToUser = task.assignees?.some((a) => a.user_id === user?.id);

  const handleToggleStatus = () => {
    if (!isAssignedToUser) return;

    const hasPendingSubtasks = task.subtasks?.some((st) => st.status !== 'done') || false;

    if (task.status !== 'done' && hasPendingSubtasks) {
      setShowCompleteDialog(true);
    } else {
      updateTask.mutate({
        taskId: task.id,
        taskData: {
          status: task.status === 'done' ? 'pending' : 'done',
        },
      });
    }
  };

  const handleCompleteAll = () => {
    updateTask.mutate({
      taskId: task.id,
      taskData: {
        status: 'done',
      },
    });
    setShowCompleteDialog(false);
  };

  const isCompleted = task.status === 'done';

  return (
    <>
      <div
        className={cn(
          'relative rounded-xl transition-all duration-200',
          'bg-card border hover:shadow-md',
          isOverdue && !isCompleted && 'bg-destructive/5 border-destructive/20',
          isCompleted && 'opacity-60'
        )}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Large Completion Checkbox */}
            <div className="pt-1">
              <div className="relative">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={handleToggleStatus}
                  disabled={!isAssignedToUser}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all',
                    isCompleted && 'bg-primary border-primary'
                  )}
                />
                {isCompleted && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <CheckCircle2 className="w-8 h-8 text-primary fill-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Jobsite Badge */}
              {jobsiteName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-medium">{jobsiteName}</span>
                </div>
              )}

              {/* Task Title */}
              <h4
                className={cn(
                  'text-lg font-semibold leading-tight',
                  isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                )}
              >
                {task.title}
              </h4>

              {/* Trade/Category */}
              {(task.trade || task.tags?.[0]) && (
                <p className="text-sm text-muted-foreground">
                  {task.trade || task.tags?.[0]?.label}
                </p>
              )}

              {/* Meta Row: Time + Priority + Overdue */}
              <div className="flex items-center gap-3 flex-wrap">
                {task.due_time && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{task.due_time}</span>
                  </div>
                )}

                {task.priority && (
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', priorityColors[task.priority])} />
                    <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                  </div>
                )}

                {isOverdue && (
                  <Badge variant="destructive" className="text-xs font-medium">
                    Overdue
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Expand/Collapse Button */}
              {(task.description || task.subtasks?.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-muted-foreground hover:text-foreground -ml-2 h-auto py-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 mr-1" />
                      Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 mr-1" />
                      Show details
                    </>
                  )}
                  {task.subtasks?.length > 0 && (
                    <span className="ml-1">
                      ({task.subtasks.filter((st) => st.status === 'done').length}/{task.subtasks.length})
                    </span>
                  )}
                </Button>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="pt-3 space-y-3 border-t">
                  {task.description && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Subtasks</p>
                      <div className="space-y-1.5 pl-3 border-l-2">
                        {task.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={subtask.status === 'done'} className="h-4 w-4" disabled />
                            <span
                              className={cn(
                                subtask.status === 'done' && 'line-through text-muted-foreground'
                              )}
                            >
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Co-Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex flex-col items-end gap-2 pt-1">
                <div className="flex items-center -space-x-2">
                  {task.assignees.slice(0, 3).map((assignee) => (
                    <Avatar key={assignee.user_id} className="w-8 h-8 border-2 border-card">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignees.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      +{task.assignees.length - 3}
                    </div>
                  )}
                </div>
                {task.assignees.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    {task.assignees.length} workers
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Task Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Some subtasks are still pending. Do you want to mark the entire task as complete?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteAll}>Complete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
