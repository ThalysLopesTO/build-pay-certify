import { Circle, CheckCircle2, AlertTriangle, XCircle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskStatus = 'pending' | 'in-progress' | 'in_progress' | 'done' | 'blocked' | 'failed';

interface StatusIconProps {
  status: TaskStatus;
  className?: string;
}

export function StatusIcon({ status, className }: StatusIconProps) {
  // Normalize status (handle both in-progress and in_progress)
  const normalizedStatus = status === 'in_progress' ? 'in-progress' : status;

  const statusConfig = {
    pending: {
      icon: Circle,
      className: 'text-muted-foreground',
      bgClassName: '',
    },
    'in-progress': {
      icon: CircleDot,
      className: 'text-blue-500',
      bgClassName: 'bg-blue-500/10',
    },
    done: {
      icon: CheckCircle2,
      className: 'text-green-500 fill-green-500',
      bgClassName: 'bg-green-500/10',
    },
    blocked: {
      icon: AlertTriangle,
      className: 'text-amber-500',
      bgClassName: 'bg-amber-500/10',
    },
    failed: {
      icon: XCircle,
      className: 'text-destructive',
      bgClassName: 'bg-destructive/10',
    },
  };

  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Icon className={cn('w-4 h-4', config.className)} />
    </div>
  );
}
