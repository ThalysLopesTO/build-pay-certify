import React from 'react';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskAssigneeChips } from './TaskAssigneeChips';
import { TaskCustomTagChip } from './TaskCustomTagChip';
import { DailyTaskItem, DailyTaskAssignee, DailyTaskTag } from '@/types/daily-tasks';
import { cn } from '@/lib/utils';

interface TaskLabelsRowProps {
  task: DailyTaskItem;
  assignees?: DailyTaskAssignee[];
  tags?: DailyTaskTag[];
  onEditLabels?: () => void;
  className?: string;
}

export const TaskLabelsRow: React.FC<TaskLabelsRowProps> = ({
  task,
  assignees = [],
  tags = [],
  onEditLabels,
  className,
}) => {
  const hasLabels = task.priority || assignees.length > 0 || tags.length > 0;

  if (!hasLabels) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 mt-1.5', className)}>
      {task.priority && <TaskPriorityBadge priority={task.priority} />}
      {assignees.length > 0 && <TaskAssigneeChips assignees={assignees} maxVisible={3} />}
      {tags.map((tag) => (
        <TaskCustomTagChip key={tag.id} tag={tag.tag_text} />
      ))}
    </div>
  );
};
