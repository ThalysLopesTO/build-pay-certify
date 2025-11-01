import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { DailyTaskItem } from '@/types/daily-tasks';
import { TaskAssigneeList } from './TaskAssigneeList';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TaskTreeItemProps {
  task: DailyTaskItem;
  onToggle: (id: string, isDone: boolean) => void;
  onUpdate: (id: string, updates: Partial<DailyTaskItem>) => void;
  onDelete: (id: string) => void;
  onAssign: (itemId: string, userId: string) => void;
  onUnassign: (itemId: string, userId: string) => void;
  canEdit?: boolean;
}

export const TaskTreeItem: React.FC<TaskTreeItemProps> = ({
  task,
  onToggle,
  onUpdate,
  onDelete,
  onAssign,
  onUnassign,
  canEdit = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const handleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdate(task.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };

  const priorityColors = {
    high: 'border-l-destructive',
    medium: 'border-l-status-pending',
    low: 'border-l-primary',
  };

  return (
    <div
      className={cn(
        'group p-3 rounded-lg bg-card border border-l-4 hover:border-primary/50 transition-all',
        task.is_done && 'opacity-60',
        task.priority && priorityColors[task.priority]
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.is_done}
          onCheckedChange={(checked) => onToggle(task.id, !!checked)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              autoFocus
            />
          ) : (
            <p
              className={cn(
                'text-sm font-medium',
                task.is_done && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </p>
          )}
          {task.notes && (
            <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
          )}
          <TaskAssigneeList
            assignees={task.daily_task_item_assignees || []}
            itemId={task.id}
            onAssign={(userId) => onAssign(task.id, userId)}
            onUnassign={(userId) => onUnassign(task.id, userId)}
            canEdit={canEdit}
          />
        </div>
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
