import React from 'react';
import { TaskPriority } from '@/types/daily-tasks';
import { BadgeWithDot } from '@/components/base/badges/badges';

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

  const priorityConfig = {
    low: {
      color: 'gray' as const,
      label: 'Low',
    },
    medium: {
      color: 'blue' as const,
      label: 'Medium',
    },
    high: {
      color: 'orange' as const,
      label: 'High',
    },
    urgent: {
      color: 'error' as const,
      label: 'Urgent',
    },
  };

  const config = priorityConfig[priority];
  
  return (
    <BadgeWithDot 
      type="pill-color" 
      color={config.color}
      size={size}
      className={className}
    >
      {showLabel ? config.label : null}
    </BadgeWithDot>
  );
};
