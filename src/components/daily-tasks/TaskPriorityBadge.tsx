import React from 'react';
import { TaskPriority } from '@/types/daily-tasks';
import { cn } from '@/lib/utils';

interface TaskPriorityBadgeProps {
  priority: TaskPriority | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
  size = 'sm',
  showLabel = true,
  className,
}) => {
  if (!priority) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const priorityConfig = {
    low: {
      bgClass: 'bg-muted border-border',
      textClass: 'text-muted-foreground',
      label: 'Low',
      dotColor: 'bg-muted-foreground',
    },
    medium: {
      bgClass: 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800',
      textClass: 'text-blue-700 dark:text-blue-400',
      label: 'Medium',
      dotColor: 'bg-blue-500',
    },
    high: {
      bgClass: 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800',
      textClass: 'text-orange-700 dark:text-orange-400',
      label: 'High',
      dotColor: 'bg-orange-500',
    },
    urgent: {
      bgClass: 'bg-red-50 border-red-400 dark:bg-red-950/30 dark:border-red-800',
      textClass: 'text-red-700 dark:text-red-400',
      label: 'Urgent',
      dotColor: 'bg-red-500 animate-pulse',
    },
  };

  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-wide',
        sizeClasses[size],
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      {showLabel && config.label}
    </span>
  );
};
