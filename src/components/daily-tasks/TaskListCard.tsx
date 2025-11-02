import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { TaskListActionsMenu } from './TaskListActionsMenu';
import { TaskListComments } from './TaskListComments';
import { DailyTaskItem } from '@/types/daily-tasks';
import { TaskListWithTasks } from '@/hooks/daily-tasks/usePaginatedTaskLists';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface TaskListCardProps {
  list: TaskListWithTasks;
  onToggleTask: (taskId: string, isDone: boolean) => void;
  onUpdateTask: (taskId: string, updates: { title: string }) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (listId: string, title: string) => void;
  onEditList: () => void;
  onDuplicateList: () => void;
  onCloseList: () => void;
  onDeleteList: () => void;
}

export const TaskListCard: React.FC<TaskListCardProps> = ({
  list,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onEditList,
  onDuplicateList,
  onCloseList,
  onDeleteList,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  const completedCount = list.tasks.filter((t) => t.is_done).length;
  const totalCount = list.tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const incompleteTasks = list.tasks.filter((t) => !t.is_done);
  const completedTasks = list.tasks.filter((t) => t.is_done);
  const visibleTasks = showCompleted ? list.tasks : incompleteTasks;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(list.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };

  const handleUpdateTask = (taskId: string) => {
    if (editTitle.trim()) {
      onUpdateTask(taskId, { title: editTitle.trim() });
      setEditingTaskId(null);
      setEditTitle('');
    }
  };

  const startEditing = (task: DailyTaskItem) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  return (
    <Card className="border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{list.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Created {format(new Date(list.created_at), 'p')} 
            </p>
          </div>
          <TaskListActionsMenu
            list={list}
            onEdit={onEditList}
            onDuplicate={onDuplicateList}
            onClose={onCloseList}
            onDelete={onDeleteList}
          />
        </div>

        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <Badge variant={progressPercentage === 100 ? "default" : "secondary"} className="text-xs">
              {completedCount}/{totalCount} tasks
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground mb-2"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? 'Hide' : 'Show'} {completedCount} completed {completedCount === 1 ? 'task' : 'tasks'}
          </Button>
        )}
        
        {visibleTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <Checkbox
              checked={task.is_done}
              onCheckedChange={(checked) => onToggleTask(task.id, checked as boolean)}
              className="shrink-0"
            />

            {editingTaskId === task.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTask(task.id);
                    if (e.key === 'Escape') setEditingTaskId(null);
                  }}
                  className="h-8"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleUpdateTask(task.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditingTaskId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span
                  className={cn(
                    'flex-1 text-sm',
                    task.is_done && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => startEditing(task)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="flex items-center gap-2 p-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="Task title..."
              className="h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleAddTask}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setIsAdding(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        )}
        
        {/* Comments Section */}
        <TaskListComments listId={list.id} />
      </CardContent>
    </Card>
  );
};
