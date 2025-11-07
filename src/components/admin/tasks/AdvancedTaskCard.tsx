import { Task } from '@/hooks/useJobsiteTasksAdvanced';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  Edit, 
  Trash2, 
  User,
  Tag as TagIcon,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { SubtaskList } from './SubtaskList';

interface AdvancedTaskCardProps {
  task: Task;
  isAdmin: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: (status: 'pending' | 'in_progress' | 'completed') => void;
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
};

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
};

export function AdvancedTaskCard({ task, isAdmin, onEdit, onDelete, onToggleStatus }: AdvancedTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  const calculateDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(task.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDuration = () => {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateSubtaskProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.status === 'completed').length;
    return (completed / task.subtasks.length) * 100;
  };

  const daysRemaining = calculateDaysRemaining();
  const isOverdue = daysRemaining < 0 && task.status !== 'completed';
  const StatusIcon = statusIcons[task.status];

  return (
    <Card className={cn(
      "p-6 transition-all duration-200 hover:shadow-lg",
      isOverdue && "border-red-500/50 bg-red-500/5"
    )}>
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {task.task_name}
            </h3>
            {task.priority && (
              <Badge variant="outline" className={cn("text-xs", priorityColors[task.priority])}>
                {task.priority}
              </Badge>
            )}
            <Badge className={cn("text-xs", statusColors[task.status])}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{calculateDuration()} days duration</span>
        </div>

        {isOverdue && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Overdue by {Math.abs(daysRemaining)} days</span>
          </div>
        )}

        {!isOverdue && task.status !== 'completed' && daysRemaining >= 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{daysRemaining} days remaining</span>
          </div>
        )}

        {task.trade && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">{task.trade}</Badge>
          </div>
        )}
      </div>

      {/* Assignees Section */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Assigned To</span>
          </div>
          <div className="flex items-center gap-2">
            {task.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.user_id} className="w-8 h-8 border-2 border-background">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{task.assignees.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tags Section */}
      {task.tags && task.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {task.tags.slice(0, 5).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{ 
                  borderColor: tag.color,
                  color: tag.color,
                  backgroundColor: `${tag.color}10`
                }}
                className="text-xs"
              >
                {tag.label}
              </Badge>
            ))}
            {task.tags.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Subtasks Section */}
      {task.subtasks && task.subtasks.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="border-t pt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Subtasks ({task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length})
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform text-muted-foreground",
                    isExpanded && "rotate-180"
                  )} />
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <Progress value={calculateSubtaskProgress()} className="mt-2 mb-3 h-2" />

            <CollapsibleContent className="space-y-2">
              <SubtaskList
                subtasks={task.subtasks}
                isEditing={false}
                onUpdate={() => {}}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Description/Notes */}
      {task.description && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {task.description}
          </p>
        </div>
      )}

      {/* Quick Status Toggle */}
      {isAdmin && onToggleStatus && (
        <div className="mt-4 pt-4 border-t flex gap-2">
          <Button
            variant={task.status === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleStatus('pending')}
            className="flex-1"
          >
            Pending
          </Button>
          <Button
            variant={task.status === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleStatus('in_progress')}
            className="flex-1"
          >
            In Progress
          </Button>
          <Button
            variant={task.status === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleStatus('completed')}
            className="flex-1"
          >
            Completed
          </Button>
        </div>
      )}
    </Card>
  );
}
