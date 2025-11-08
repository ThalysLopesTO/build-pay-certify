import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  Edit,
  Copy,
  ArrowRight,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  Briefcase,
  Wrench,
} from 'lucide-react';
import { StatusIcon } from './StatusIcon';
import { SubtaskItem } from './SubtaskItem';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Task, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { cn } from '@/lib/utils';
import { formatInCompanyTimezone, DEFAULT_TIMEZONE } from '@/utils/timezone';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onMoveToTomorrow: () => void;
  onDelete: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function TaskItem({
  task,
  isExpanded,
  onToggle,
  onEdit,
  onDuplicate,
  onMoveToTomorrow,
  onDelete,
  isSelectable,
  isSelected,
  onSelect,
}: TaskItemProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState<Date | undefined>();
  const { updateTask, bulkCompleteSubtasks, duplicateTaskToDate } = useTaskActions();
  const { settings } = useCompanySettings();
  const { user } = useAuth();
  const companyTimezone = settings?.timezone || DEFAULT_TIMEZONE;

  const todayStr = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);
  const isOverdue = task.task_date < todayStr && task.status !== 'done';
  const isAssignedToUser = task.assignees.some(a => a.user_id === user?.id);
  const isAdmin = ['admin', 'super_admin', 'foreman'].includes(user?.role || '');
  const canEdit = isAdmin;
  const canToggleStatus = isAdmin || isAssignedToUser;

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '?';
  };

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'done' | 'blocked' | 'failed') => {
    if (!canToggleStatus) return;

    // If completing and has pending subtasks, show dialog
    if (newStatus === 'done' && task.subtasks.some(st => st.status !== 'done')) {
      setShowCompleteDialog(true);
      return;
    }

    await updateTask.mutateAsync({
      taskId: task.id,
      taskData: { status: newStatus },
    });
  };

  const handleCompleteAll = async () => {
    await Promise.all([
      updateTask.mutateAsync({ taskId: task.id, taskData: { status: 'done' } }),
      bulkCompleteSubtasks.mutateAsync(task.id),
    ]);
    setShowCompleteDialog(false);
  };

  const handleCompleteTaskOnly = async () => {
    await updateTask.mutateAsync({
      taskId: task.id,
      taskData: { status: 'done' },
    });
    setShowCompleteDialog(false);
  };

  const handleDuplicateToDate = async () => {
    if (!duplicateDate) return;

    const targetDate = format(duplicateDate, 'yyyy-MM-dd');
    
    // Validate future date
    if (targetDate < todayStr) {
      return;
    }

    await duplicateTaskToDate.mutateAsync({
      taskId: task.id,
      newDate: targetDate,
    });

    setShowDuplicateDialog(false);
    setDuplicateDate(undefined);
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return '';
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500';
      case 'low':
        return 'bg-blue-500/10 text-blue-600 border-blue-500';
      default:
        return '';
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'border border-border rounded-xl p-4 transition-all duration-200',
          'hover:shadow-md hover:border-primary/30 bg-card',
          isExpanded && 'bg-muted/30',
          isOverdue && 'border-destructive/50'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox for selection */}
          {isSelectable && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}

          {/* Status Icon */}
          <div className="mt-0.5">
            {canToggleStatus ? (
              <Select
                value={task.status}
                onValueChange={handleStatusChange}
                disabled={!canToggleStatus}
              >
                <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent">
                  <StatusIcon status={task.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <StatusIcon status={task.status} />
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {/* Title & Meta */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={onToggle}
                  className="text-left w-full group"
                >
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      'font-medium text-foreground group-hover:text-primary transition-colors',
                      task.status === 'done' && 'line-through text-muted-foreground'
                    )}>
                      {task.title}
                    </h3>
                    {task.subtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length})
                      </span>
                    )}
                  </div>
                </button>

                {/* Meta Row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Due Time */}
                  {task.due_time && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      {task.due_time.slice(0, 5)}
                    </Badge>
                  )}

                  {/* Priority */}
                  {task.priority && task.priority !== 'medium' && (
                    <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                  )}

                  {/* Trade */}
                  {task.trade && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Wrench className="w-3 h-3" />
                      {task.trade}
                    </Badge>
                  )}

                  {/* Overdue */}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </Badge>
                  )}

                  {/* Assignees */}
                  {task.assignees.length > 0 && (
                    <div className="flex items-center -space-x-2">
                      {task.assignees.slice(0, 3).map((assignee) => (
                        <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">
                            {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{task.tags.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Expand/Collapse */}
                {task.subtasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* Kebab Menu */}
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate to Date
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onMoveToTomorrow}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Move to Tomorrow
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && !isExpanded && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3"
                >
                  {/* Description */}
                  {task.description && (
                    <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                      {task.description}
                    </div>
                  )}

                  {/* Subtasks */}
                  {task.subtasks.length > 0 && (
                    <div className="space-y-1">
                      {task.subtasks.map((subtask) => (
                      <SubtaskItem
                        key={subtask.id}
                        subtask={subtask}
                        isEditable={canEdit}
                      />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Complete with Subtasks Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete all subtasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This task has {task.subtasks.filter(st => st.status !== 'done').length} incomplete subtask(s). 
              Would you like to complete them all?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleCompleteTaskOnly} variant="outline">
              Task Only
            </Button>
            <AlertDialogAction onClick={handleCompleteAll}>
              Complete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate to Date Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate task to date</AlertDialogTitle>
            <AlertDialogDescription>
              Select a future date to duplicate this task with all its assignees, tags, and subtasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={duplicateDate}
              onSelect={setDuplicateDate}
              disabled={(date) => format(date, 'yyyy-MM-dd') < todayStr}
              initialFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDuplicateDate(undefined)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDuplicateToDate}
              disabled={!duplicateDate}
            >
              Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
