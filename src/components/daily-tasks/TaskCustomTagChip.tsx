import React from 'react';
import { X } from 'lucide-react';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { cn } from '@/lib/utils';

interface TaskCustomTagChipProps {
  tag: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const TaskCustomTagChip: React.FC<TaskCustomTagChipProps> = ({
  tag,
  onRemove,
  size = 'sm',
  className,
}) => {
  return (
    <BadgeWithDot
      type="modern"
      color="gray"
      size={size}
      className={cn('group', className)}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          type="button"
        >
          <X className="h-3 w-3 hover:text-destructive" />
        </button>
      )}
    </BadgeWithDot>
  );
};
