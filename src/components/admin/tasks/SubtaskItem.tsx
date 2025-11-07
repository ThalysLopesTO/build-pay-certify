import { Subtask } from '@/hooks/useJobsiteTasksAdvanced';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface SubtaskItemProps {
  subtask: Subtask;
  isEditing: boolean;
  onToggleStatus?: (subtaskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
}

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
};

const statusColors = {
  pending: 'text-muted-foreground',
  in_progress: 'text-primary',
  completed: 'text-green-600 dark:text-green-400',
};

export function SubtaskItem({ subtask, isEditing, onToggleStatus }: SubtaskItemProps) {
  const StatusIcon = statusIcons[subtask.status];
  const isCompleted = subtask.status === 'completed';

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  const handleToggle = () => {
    if (onToggleStatus) {
      const newStatus = isCompleted ? 'pending' : 'completed';
      onToggleStatus(subtask.id, newStatus);
    }
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border bg-card transition-all",
      isCompleted && "opacity-60"
    )}>
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={!onToggleStatus}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <StatusIcon className={cn("w-4 h-4", statusColors[subtask.status])} />
          <span className={cn(
            "text-sm font-medium",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {subtask.title}
          </span>
          <Badge
            variant="secondary"
            className={cn("text-xs", statusColors[subtask.status])}
          >
            {subtask.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Assignees */}
        {subtask.assignees && subtask.assignees.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {subtask.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.user_id} className="w-6 h-6 border border-background">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(assignee.user_profiles.first_name, assignee.user_profiles.last_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {subtask.assignees.length > 3 && (
              <Badge variant="outline" className="text-[10px] h-6 px-1.5">
                +{subtask.assignees.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Tags */}
        {subtask.tags && subtask.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {subtask.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{ 
                  borderColor: tag.color,
                  color: tag.color,
                  backgroundColor: `${tag.color}10`
                }}
                className="text-[10px] h-5"
              >
                {tag.label}
              </Badge>
            ))}
            {subtask.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] h-5">
                +{subtask.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
