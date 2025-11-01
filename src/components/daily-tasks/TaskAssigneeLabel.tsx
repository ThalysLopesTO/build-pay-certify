import React from 'react';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskAssigneeLabelProps {
  userId: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  onRemove?: () => void;
  showRemove?: boolean;
}

export const TaskAssigneeLabel = ({
  firstName = '',
  lastName = '',
  photoUrl,
  onRemove,
  showRemove = false,
}: TaskAssigneeLabelProps) => {
  const displayName = `${firstName} ${lastName}`.trim() || 'Unknown';

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors">
      <EmployeeAvatar
        photoUrl={photoUrl}
        firstName={firstName}
        lastName={lastName}
        size="sm"
        className="w-5 h-5"
      />
      <span>{displayName}</span>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
