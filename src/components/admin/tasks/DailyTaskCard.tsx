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
  ArrowRight,
  Trash2,
  CheckCircle2,
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
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

export function DailyTaskCard({ task, onEdit, isSelected = false, onToggleSelection }: DailyTaskCardProps) {
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

  const isCompleted = task.status === 'done';

  return (
    <>
      {/* Clean Card Design */}
      <div className={cn(
        'group relative rounded-xl transition-all duration-200',
        'bg-card border hover:shadow-md',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        isOverdue && !isCompleted && 'bg-destructive/5 border-destructive/20',
        isCompleted && 'opacity-60'
      )}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Left Side: Checkboxes */}
            <div className="flex items-center gap-3 pt-1">
              {/* Selection Checkbox */}
              {onToggleSelection && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelection}
                  className="h-5 w-5"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              
              {/* Completion Checkbox - Larger, more prominent */}
              <div className="relative">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={handleToggleStatus}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all',
                    isCompleted && 'bg-primary border-primary'
                  )}
                />
                {/* Blue checkmark when completed */}
                {isCompleted && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <CheckCircle2 className="w-7 h-7 text-primary fill-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Task Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Task Title - Larger, cleaner typography */}
              <h4 className={cn(
                'text-lg font-semibold leading-tight',
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              )}>
                {task.title}
              </h4>

              {/* Subtitle/Category */}
              {(task.trade || task.tags?.[0]) && (
                <p className="text-sm text-muted-foreground">
                  {task.trade || task.tags?.[0]?.label}
                </p>
              )}

              {/* Meta Row: Time + Priority */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Time Display */}
                {task.due_time && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{task.due_time}</span>
                  </div>
                )}

                {/* Priority Dot (minimal) */}
                {task.priority && (
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    task.priority === 'low' && 'bg-blue-500',
                    task.priority === 'medium' && 'bg-yellow-500',
                    task.priority === 'high' && 'bg-orange-500'
                  )} />
                )}

                {/* Overdue indicator */}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs font-medium">
                    Overdue
                  </Badge>
                )}
              </div>

              {/* Expandable Details Toggle */}
              {(task.description || task.subtasks?.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-muted-foreground hover:text-foreground -ml-2 h-auto py-1"
                >
                  {isExpanded ? 'Hide' : 'Show'} details
                  {task.subtasks?.length > 0 && (
                    <span className="ml-1">
                      ({task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length})
                    </span>
                  )}
                </Button>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="pt-3 space-y-3">
                  {task.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}
                  
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="space-y-1.5 pl-3 border-l-2">
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2 text-sm">
                          <Checkbox 
                            checked={subtask.status === 'done'} 
                            className="h-4 w-4" 
                            disabled 
                          />
                          <span className={cn(
                            subtask.status === 'done' && 'line-through text-muted-foreground'
                          )}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Assignees + Menu */}
            <div className="flex flex-col items-end gap-2 pt-1">
              {/* Assignee Avatars - Like reference */}
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center -space-x-2">
                  {task.assignees.slice(0, 2).map((assignee, idx) => (
                    <Avatar 
                      key={assignee.user_id} 
                      className="w-8 h-8 border-2 border-card"
                    >
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignees.length > 2 && (
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      +{task.assignees.length - 2}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMoveToTomorrow}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Move to Tomorrow
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)} 
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
