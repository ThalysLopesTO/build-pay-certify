import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTaskMutations } from '@/hooks/daily-tasks/useTaskMutations';
import type { DailyTaskItem } from '@/types/daily-tasks';
import { MoreVertical, Trash2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskQuickAdd } from './TaskQuickAdd';
import { TaskAssigneeList } from './TaskAssigneeList';
import { format } from 'date-fns';

interface TaskTreeItemProps {
  item: DailyTaskItem;
  listId: string;
  level: number;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export const TaskTreeItem = ({ item, listId, level }: TaskTreeItemProps) => {
  const [showSubtaskAdd, setShowSubtaskAdd] = useState(false);
  const { toggleTask, deleteTask } = useTaskMutations();

  const handleToggle = () => {
    toggleTask.mutate({ id: item.id, is_done: !item.is_done });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(item.id);
    }
  };

  return (
    <div className="group">
      <div className="py-2 px-3 rounded hover:bg-accent transition-colors">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={item.is_done}
            onCheckedChange={handleToggle}
            className="flex-shrink-0"
          />
          <span className={`flex-1 ${item.is_done ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </span>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.priority !== 'medium' && (
              <Badge variant="secondary" className={priorityColors[item.priority]}>
                {item.priority}
              </Badge>
            )}
            {item.due_date && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(item.due_date), 'MMM dd')}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSubtaskAdd(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Assignee labels below task title */}
        <div className="ml-6">
          <TaskAssigneeList item={item} listId={listId} />
        </div>
      </div>

      {showSubtaskAdd && (
        <div className="ml-6 mt-2 mb-2">
          <TaskQuickAdd
            listId={listId}
            parentItemId={item.id}
            onSuccess={() => setShowSubtaskAdd(false)}
            onCancel={() => setShowSubtaskAdd(false)}
          />
        </div>
      )}
    </div>
  );
};
