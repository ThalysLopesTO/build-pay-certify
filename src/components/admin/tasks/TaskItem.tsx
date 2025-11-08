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
import { TaskStatusBadge } from './TaskStatusBadge';
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

  const now = new Date();
  const todayStr = formatInCompanyTimezone(now, 'yyyy-MM-dd', companyTimezone);
  const currentTime = formatInCompanyTimezone(now, 'HH:mm', companyTimezone);
  
  const isOverdue = (
    (task.task_date < todayStr && task.status !== 'done') ||
    (task.task_date === todayStr && task.due_time && task.due_time < currentTime && task.status !== 'done')
  );
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
          'py-2 px-3 transition-all duration-200 border-b border-border/50',
          'hover:bg-muted/30',
          isExpanded && 'bg-muted/20',
          isOverdue && 'bg-destructive/5 border-l-4 border-l-destructive pl-2'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Checkbox for selection */}
          {isSelectable && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Status Icon - Clickable */}
          <div 
            className="cursor-pointer flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (!canToggleStatus) return;
              
              const statusCycle: Array<'pending' | 'in_progress' | 'done'> = ['pending', 'in_progress', 'done'];
              const currentIndex = statusCycle.indexOf(task.status as any);
              const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
              handleStatusChange(nextStatus);
            }}
          >
            <StatusIcon status={task.status} />
          </div>

          {/* Main Content - Clickable Row */}
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={onToggle}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Title & Inline Meta */}
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <h3 className={cn(
                  'font-medium text-base',
                  task.status === 'done' && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </h3>

                {/* Subtask Count */}
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length}
                  </span>
                )}

                {/* Priority Badge - only if not medium */}
                {task.priority && task.priority !== 'medium' && (
                  <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
                    {task.priority}
                  </Badge>
                )}

                {/* Assignees - max 2 + counter */}
                {task.assignees.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {task.assignees.slice(0, 2).map((assignee) => (
                      <Avatar key={assignee.user_id} className="h-5 w-5 border-2 border-background">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {task.assignees.length > 2 && (
                      <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                        +{task.assignees.length - 2}
                      </div>
                    )}
                  </div>
                )}

                {/* Tags - max 2 + counter */}
                {task.tags.length > 0 && (
                  <>
                    {task.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs h-5 px-1.5"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          color: tag.color,
                          borderColor: `${tag.color}40`,
                        }}
                      >
                        {tag.label}
                      </Badge>
                    ))}
                    {task.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                        +{task.tags.length - 2}
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* Right Side: Status Badge & Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <TaskStatusBadge status={task.status} />

                {/* Kebab Menu */}
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDuplicateDialog(true); }}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate to Date
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToTomorrow(); }}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Move to Tomorrow
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-2 ml-1"
                >
                  {/* Description */}
                  {task.description && (
                    <p className="text-sm text-muted-foreground pl-1">
                      {task.description}
                    </p>
                  )}

                  {/* Meta Info Row - only in expanded */}
                  {(task.due_time || task.trade || isOverdue) && (
                    <div className="flex items-center gap-2 pl-1 flex-wrap">
                      {task.due_time && (
                        <Badge variant="outline" className="text-xs gap-1 h-5">
                          <Clock className="w-3 h-3" />
                          {task.due_time.slice(0, 5)}
                        </Badge>
                      )}
                      {task.trade && (
                        <Badge variant="outline" className="text-xs gap-1 h-5">
                          <Briefcase className="w-3 h-3" />
                          {task.trade}
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs gap-1 h-5">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Subtasks with vertical dashed line */}
                  {task.subtasks.length > 0 && (
                    <div className="space-y-0">
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
