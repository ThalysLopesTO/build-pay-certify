import React, { useState } from 'react';
import { TaskAssigneeLabel } from './TaskAssigneeLabel';
import { TaskAssigneeSelector } from './TaskAssigneeSelector';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { DailyTaskItem } from '@/types/daily-tasks';

interface TaskAssigneeListProps {
  item: DailyTaskItem;
  listId: string;
}

export const TaskAssigneeList = ({ item, listId }: TaskAssigneeListProps) => {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap mt-1">
      {item.assignees?.map((assignee) => (
        <TaskAssigneeLabel
          key={assignee.user_id}
          userId={assignee.user_id}
          firstName={assignee.user_profiles?.first_name}
          lastName={assignee.user_profiles?.last_name}
          photoUrl={assignee.user_profiles?.photo_url}
        />
      ))}
      
      <TaskAssigneeSelector
        taskId={item.id}
        listId={listId}
        currentAssignees={item.assignees || []}
        open={showSelector}
        onOpenChange={setShowSelector}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowSelector(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Assign
        </Button>
      </TaskAssigneeSelector>
    </div>
  );
};
