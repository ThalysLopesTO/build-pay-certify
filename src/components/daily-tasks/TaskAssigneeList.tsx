import React, { useState } from 'react';
import { TaskAssigneeLabel } from './TaskAssigneeLabel';
import { TaskAssigneeSelector } from './TaskAssigneeSelector';
import { DailyTaskAssignee } from '@/types/daily-tasks';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskAssigneeListProps {
  assignees: DailyTaskAssignee[];
  itemId: string;
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  canEdit?: boolean;
}

export const TaskAssigneeList: React.FC<TaskAssigneeListProps> = ({
  assignees,
  itemId,
  onAssign,
  onUnassign,
  canEdit = true,
}) => {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {assignees.map((assignee) => (
        <TaskAssigneeLabel
          key={assignee.user_id}
          assignee={assignee}
          onRemove={canEdit ? () => onUnassign(assignee.user_id) : undefined}
          showRemove={canEdit}
        />
      ))}
      {canEdit && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSelector(true)}
            className="h-7 px-2 text-xs"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Assign
          </Button>
          <TaskAssigneeSelector
            open={showSelector}
            onClose={() => setShowSelector(false)}
            onAssign={(userId) => {
              onAssign(userId);
              setShowSelector(false);
            }}
            currentAssignees={assignees.map((a) => a.user_id)}
          />
        </>
      )}
    </div>
  );
};
