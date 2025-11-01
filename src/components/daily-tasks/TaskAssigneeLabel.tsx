import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { DailyTaskAssignee } from '@/types/daily-tasks';

interface TaskAssigneeLabelProps {
  assignee: DailyTaskAssignee;
  onRemove?: () => void;
  showRemove?: boolean;
}

export const TaskAssigneeLabel: React.FC<TaskAssigneeLabelProps> = ({
  assignee,
  onRemove,
  showRemove = false,
}) => {
  const firstName = assignee.user_profiles?.first_name || '';
  const lastName = assignee.user_profiles?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background border border-border text-xs font-medium group hover:border-primary transition-colors">
      <Avatar className="h-5 w-5">
        <AvatarImage src={assignee.user_profiles?.photo_url || undefined} alt={fullName} />
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-foreground">{fullName}</span>
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          type="button"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </div>
  );
};
