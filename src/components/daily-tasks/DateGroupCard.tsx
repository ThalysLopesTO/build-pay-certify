import React from 'react';
import { Card } from '@/components/ui/card';
import { TaskListCard } from './TaskListCard';
import { DateGroup } from '@/hooks/daily-tasks/usePaginatedTaskLists';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

interface DateGroupCardProps {
  dateGroup: DateGroup;
  onToggleTask: (taskId: string, isDone: boolean) => void;
  onUpdateTask: (taskId: string, updates: { title: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (listId: string, title: string) => void;
  onEditList: (listId: string) => void;
  onDuplicateList: (listId: string) => void;
  onCloseList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
}

export const DateGroupCard: React.FC<DateGroupCardProps> = ({
  dateGroup,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onEditList,
  onDuplicateList,
  onCloseList,
  onDeleteList,
}) => {
  return (
    <div className="space-y-4">
      {/* Date Header */}
      <div className="flex items-center justify-between bg-muted/30 px-4 py-3 rounded-lg border border-border/50">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {dateGroup.dateFormatted}
            </h2>
            <p className="text-xs text-muted-foreground">
              {dateGroup.lists.length} {dateGroup.lists.length === 1 ? 'list' : 'lists'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {dateGroup.completedTasks}/{dateGroup.totalTasks} tasks completed
        </Badge>
      </div>

      {/* Task Lists for this Date */}
      <div className="space-y-3 pl-4">
        {dateGroup.lists.map((list) => (
          <TaskListCard
            key={list.id}
            list={list}
            onToggleTask={onToggleTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onAddTask={onAddTask}
            onEditList={() => onEditList(list.id)}
            onDuplicateList={() => onDuplicateList(list.id)}
            onCloseList={() => onCloseList(list.id)}
            onDeleteList={() => onDeleteList(list.id)}
          />
        ))}
      </div>
    </div>
  );
};
