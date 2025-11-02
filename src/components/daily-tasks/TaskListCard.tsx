import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskListActionsMenu } from './TaskListActionsMenu';
import { TaskListComments } from './TaskListComments';
import { EnhancedTaskItem } from './EnhancedTaskItem';
import { CreateTaskDialog } from './CreateTaskDialog';
import { DailyTaskItem } from '@/types/daily-tasks';
import { TaskListWithTasks } from '@/hooks/daily-tasks/usePaginatedTaskLists';
import { useCreateTaskWithLabels } from '@/hooks/daily-tasks/useCreateTaskWithLabels';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface TaskListCardProps {
  list: TaskListWithTasks;
  onToggleTask: (taskId: string, isDone: boolean) => void;
  onUpdateTask: (taskId: string, updates: Partial<DailyTaskItem>) => void;
  onDeleteTask: (taskId: string) => void;
  onEditList: () => void;
  onDuplicateList: () => void;
  onCloseList: () => void;
  onDeleteList: () => void;
  canEdit: boolean;
}

export const TaskListCard: React.FC<TaskListCardProps> = ({
  list,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onEditList,
  onDuplicateList,
  onCloseList,
  onDeleteList,
  canEdit,
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const createTask = useCreateTaskWithLabels(list.id);

  const completedCount = list.tasks.filter((t) => t.is_done).length;
  const totalCount = list.tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const visibleTasks = showCompleted ? list.tasks : list.tasks.filter((t) => !t.is_done);

  const handleCreateTask = async (data: {
    title: string;
    priority: string;
    notes?: string;
    assignee_ids: string[];
    tags: string[];
  }) => {
    await createTask.mutateAsync({
      list_id: list.id,
      ...data,
    });
    setShowCreateDialog(false);
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
          <EnhancedTaskItem
            key={task.id}
            task={task}
            assignees={task.daily_task_item_assignees || []}
            tags={task.daily_task_item_tags || []}
            canEdit={canEdit}
            onToggle={(taskId) => onToggleTask(taskId, !task.is_done)}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add task
        </Button>
        
        {/* Comments Section */}
        <TaskListComments listId={list.id} />

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateTask}
          isLoading={createTask.isPending}
        />
      </CardContent>
    </Card>
  );
};
