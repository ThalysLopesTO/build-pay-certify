import { useState } from 'react';
import { Task, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  MoreVertical,
  Edit,
  Copy,
  ArrowRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatInCompanyTimezone, DEFAULT_TIMEZONE } from '@/utils/timezone';

interface DailyTaskCardProps {
  task: Task;
  onEdit: () => void;
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

export function DailyTaskCard({ task, onEdit }: DailyTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const { updateTask, deleteTask, moveTaskToTomorrow, duplicateTaskToDate } = useTaskActions();
  const { settings } = useCompanySettings();
  const companyTimezone = settings?.timezone || DEFAULT_TIMEZONE;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  // Calculate overdue status using company timezone
  const todayInCompanyTZ = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);
  const isOverdue =
    task.task_date && 
    task.task_date < todayInCompanyTZ && 
    task.status !== 'done';

  const handleToggleStatus = () => {
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

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    setShowDeleteDialog(false);
  };

  const handleMoveToTomorrow = () => {
    if (!task.task_date) return;
    const todayInCompanyTZ = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);
    const tomorrow = format(addDays(new Date(todayInCompanyTZ + 'T12:00:00'), 1), 'yyyy-MM-dd');
    updateTask.mutate({
      taskId: task.id,
      taskData: {
        task_date: tomorrow,
      },
    });
  };

  return (
    <>
      <div className={cn('p-4 hover:bg-muted/30 transition-colors', isOverdue && 'bg-red-50/50 dark:bg-red-950/20')}>
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={task.status === 'done'}
            onCheckedChange={handleToggleStatus}
            className="mt-1 h-5 w-5"
          />

          {/* Task Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title & Priority */}
            <div className="flex items-start justify-between gap-2">
              <h4
                className={cn(
                  'font-semibold text-base',
                  task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                )}
              >
                {task.title}
              </h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Duplicate')}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate to another date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMoveToTomorrow}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move to Tomorrow
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta Info Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Assignees */}
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  {task.assignees.slice(0, 3).map((assignee) => (
                    <Avatar key={assignee.user_id} className="w-6 h-6 border">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignees.length > 3 && (
                    <Badge variant="secondary" className="text-xs h-6 px-2">
                      +{task.assignees.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Priority */}
              {task.priority && (
                <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
              )}

              {/* Trade */}
              {task.trade && (
                <Badge variant="secondary" className="text-xs">
                  {task.trade}
                </Badge>
              )}

              {/* Due Time */}
              {task.due_time && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{task.due_time}</span>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {task.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                        backgroundColor: `${tag.color}10`,
                      }}
                      className="text-xs"
                    >
                      {tag.label}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{task.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Overdue Badge */}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}

              {/* Status Badge */}
              <Badge
                variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {task.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Expandable Description & Subtasks */}
            {(task.description || (task.subtasks && task.subtasks.length > 0)) && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show details
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="ml-1">
                            ({task.subtasks.filter((st) => st.status === 'done').length}/{task.subtasks.length}{' '}
                            subtasks)
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-3 mt-3">
                  {/* Description */}
                  {task.description && (
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                      {task.description}
                    </div>
                  )}

                  {/* Subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <span>Subtasks</span>
                        <span className="text-muted-foreground font-normal">
                          ({task.subtasks.filter((st) => st.status === 'done').length}/{task.subtasks.length})
                        </span>
                      </h5>
                      <div className="space-y-1.5 pl-2 border-l-2 border-border">
                        {task.subtasks
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((subtask) => (
                            <div key={subtask.id} className="flex items-start gap-2 text-sm">
                              <Checkbox checked={subtask.status === 'done'} className="h-4 w-4 mt-0.5" disabled />
                              <span
                                className={cn(
                                  'flex-1',
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
                </CollapsibleContent>
              </Collapsible>
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

      {/* Delete Task Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all its subtasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
