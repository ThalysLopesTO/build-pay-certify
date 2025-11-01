import React from 'react';
import { DailyTaskList } from '@/types/daily-tasks';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskListHeaderProps {
  list: DailyTaskList;
  totalTasks: number;
  completedTasks: number;
}

export const TaskListHeader: React.FC<TaskListHeaderProps> = ({
  list,
  totalTasks,
  completedTasks,
}) => {
  return (
    <div className="p-4 border-b bg-muted/30">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-foreground">{list.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {completedTasks}/{totalTasks}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{format(new Date(list.for_date), 'MMM dd, yyyy')}</span>
      </div>
    </div>
  );
};
