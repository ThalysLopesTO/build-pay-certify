import React from 'react';
import { X, Tag } from 'lucide-react';
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
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted border border-border text-muted-foreground font-medium group hover:border-primary transition-colors',
        sizeClasses[size],
        className
      )}
    >
      <Tag className="h-3 w-3" />
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          type="button"
        >
          <X className="h-3 w-3 hover:text-destructive" />
        </button>
      )}
    </span>
  );
};
