import React from 'react';
import { Card } from '@/components/ui/card';
import { TaskListCard } from './TaskListCard';
import { DateGroup } from '@/hooks/daily-tasks/usePaginatedTaskLists';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DateGroupCardProps {
  dateGroup: DateGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleTask: (taskId: string, isDone: boolean) => void;
  onUpdateTask: (taskId: string, updates: { title: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onEditList: (listId: string) => void;
  onDuplicateList: (listId: string) => void;
  onCloseList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
}

export const DateGroupCard: React.FC<DateGroupCardProps> = ({
  dateGroup,
  isExpanded,
  onToggle,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onEditList,
  onDuplicateList,
  onCloseList,
  onDeleteList,
}) => {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
        {/* Date Header - Clickable */}
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between bg-muted/30 hover:bg-muted/50 px-4 py-4 rounded-t-lg border-b border-border/50 cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {dateGroup.dateFormatted}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {dateGroup.lists.length} {dateGroup.lists.length === 1 ? 'list' : 'lists'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {dateGroup.completedTasks}/{dateGroup.totalTasks} tasks
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Task Lists for this Date - Collapsible */}
        <CollapsibleContent className="animate-accordion-down">
          <div className="space-y-3 p-4">
            {dateGroup.lists.map((list) => (
              <TaskListCard
                key={list.id}
                list={list}
                onToggleTask={onToggleTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onEditList={() => onEditList(list.id)}
                onDuplicateList={() => onDuplicateList(list.id)}
                onCloseList={() => onCloseList(list.id)}
                onDeleteList={() => onDeleteList(list.id)}
                canEdit={true}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
