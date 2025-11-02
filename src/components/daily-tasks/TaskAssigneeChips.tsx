import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { DailyTaskAssignee } from '@/types/daily-tasks';
import { cn } from '@/lib/utils';

interface TaskAssigneeChipsProps {
  assignees: DailyTaskAssignee[];
  onRemove?: (userId: string) => void;
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const TaskAssigneeChips: React.FC<TaskAssigneeChipsProps> = ({
  assignees,
  onRemove,
  maxVisible = 5,
  size = 'sm',
  className,
}) => {
  const visible = assignees.slice(0, maxVisible);
  const remaining = assignees.length - maxVisible;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const avatarSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {visible.map((assignee) => {
        const firstName = assignee.user_profiles?.first_name || '';
        const lastName = assignee.user_profiles?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

        return (
          <div
            key={assignee.user_id}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full bg-background border border-border font-medium group hover:border-primary transition-colors',
              sizeClasses[size]
            )}
          >
            <Avatar className={avatarSizes[size]}>
              <AvatarImage src={assignee.user_profiles?.photo_url || undefined} alt={fullName} />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-foreground">{fullName || 'Unknown'}</span>
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(assignee.user_id);
                }}
                className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        );
      })}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground px-2">+{remaining} more</span>
      )}
    </div>
  );
};
