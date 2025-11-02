import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DailyTaskItem, DailyTaskAssignee, DailyTaskTag } from '@/types/daily-tasks';
import { TaskLabelsRow } from './TaskLabelsRow';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { cn } from '@/lib/utils';
interface EnhancedTaskItemProps {
  task: DailyTaskItem;
  assignees?: DailyTaskAssignee[];
  tags?: DailyTaskTag[];
  listName?: string;
  canEdit: boolean;
  onToggle: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<DailyTaskItem>) => void;
  onDelete: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  indentLevel?: number;
}
export const EnhancedTaskItem: React.FC<EnhancedTaskItemProps> = ({
  task,
  assignees = [],
  tags = [],
  listName,
  canEdit,
  onToggle,
  onUpdate,
  onDelete,
  onEdit,
  indentLevel = 0
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const handleSaveEdit = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdate(task.id, {
        title: editedTitle.trim()
      });
    }
    setIsEditing(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };
  const priorityConfig = {
    low: 'bg-muted-foreground',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500 animate-pulse'
  };
  const priorityDotClass = task.priority ? priorityConfig[task.priority] : '';
  return <div className={cn('group py-2 px-3 rounded-md hover:bg-accent/50 transition-all', task.is_done && 'opacity-60', indentLevel > 0 && 'ml-8')} style={{
    paddingLeft: indentLevel > 0 ? `${indentLevel * 32}px` : undefined
  }}>
      <div className="flex items-start gap-3">
        {/* Priority Dot */}
        {task.priority && <div className="flex-shrink-0 mt-1.5">
            
          </div>}

        {/* Checkbox */}
        <Checkbox checked={task.is_done} onCheckedChange={() => onToggle(task.id)} className="mt-1" />

        {/* Title and Labels */}
        <div className="flex-1 min-w-0">
          {isEditing ? <Input value={editedTitle} onChange={e => setEditedTitle(e.target.value)} onBlur={handleSaveEdit} onKeyDown={handleKeyDown} autoFocus className="h-8 text-sm" /> : <>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium text-foreground', task.is_done && 'line-through')}>
                  {task.title}
                </span>
                {listName && <span className="text-xs text-muted-foreground">• {listName}</span>}
              </div>
              <TaskLabelsRow task={task} assignees={assignees} tags={tags} />
              
              {/* Subtask Progress */}
              {task.subtasks && task.subtasks.length > 0 && <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 max-w-[100px] bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{
                width: `${task.subtasks.filter(s => s.is_done).length / task.subtasks.length * 100}%`
              }} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.subtasks.filter(s => s.is_done).length}/{task.subtasks.length}
                  </span>
                </div>}
            </>}
        </div>

        {/* Actions Menu */}
        {canEdit && !isEditing && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
            if (onEdit) {
              onEdit(task.id);
            } else {
              setIsEditing(true);
            }
          }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
      </div>

      {/* Render Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && <div className="mt-1">
          {task.subtasks.map(subtask => <EnhancedTaskItem key={subtask.id} task={subtask} assignees={subtask.daily_task_item_assignees || []} tags={subtask.daily_task_item_tags || []} canEdit={canEdit} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onEdit={onEdit} indentLevel={indentLevel + 1} />)}
        </div>}
    </div>;
};