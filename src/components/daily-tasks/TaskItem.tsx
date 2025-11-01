import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskWithList } from '@/hooks/daily-tasks/useAllJobsiteTasks';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: TaskWithList;
  onToggle: (id: string, isDone: boolean) => void;
  onUpdate: (id: string, updates: { title: string }) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onUpdate,
  onDelete,
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

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/20 transition-colors border-b border-border/30',
        task.is_done && 'opacity-60'
      )}
    >
      <Checkbox
        variant="circle"
        size="default"
        checked={task.is_done}
        onCheckedChange={(checked) => onToggle(task.id, !!checked)}
        className="border-muted-foreground/30"
      />

      <div className="flex-1 min-w-0 flex items-center gap-3">
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm flex-1"
            autoFocus
          />
        ) : (
          <span
            className={cn(
              'text-sm font-medium text-foreground',
              task.is_done && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
        )}

        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
          {task.list_name}
        </span>
      </div>

      {canEdit && !isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
