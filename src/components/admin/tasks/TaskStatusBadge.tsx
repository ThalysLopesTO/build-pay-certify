import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked' | 'failed';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'pending',
      className: 'bg-muted text-muted-foreground border-muted-foreground/20',
    },
    in_progress: {
      label: 'in-progress',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    },
    done: {
      label: 'completed',
      className: 'bg-green-500/10 text-green-600 border-green-500/30',
    },
    blocked: {
      label: 'need-help',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    },
    failed: {
      label: 'failed',
      className: 'bg-destructive/10 text-destructive border-destructive/30',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium px-2 py-0.5',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
