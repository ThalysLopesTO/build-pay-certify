import React from 'react';
import { Card } from '@/components/ui/card';
import { TaskListHeader } from './TaskListHeader';
import { TaskTreeItem } from './TaskTreeItem';
import { TaskQuickAdd } from './TaskQuickAdd';
import { DailyTaskList } from '@/types/daily-tasks';
import { useDailyTaskItems } from '@/hooks/daily-tasks/useDailyTaskItems';
import { useTaskMutations } from '@/hooks/daily-tasks/useTaskMutations';
import { useTaskAssigneeMutations } from '@/hooks/daily-tasks/useTaskAssigneeMutations';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TaskListContainerProps {
  list: DailyTaskList;
}

export const TaskListContainer: React.FC<TaskListContainerProps> = ({ list }) => {
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useDailyTaskItems(list.id);
  const { createTask, updateTask, toggleComplete, deleteTask } = useTaskMutations(list.id);
  const { assignEmployee, unassignEmployee } = useTaskAssigneeMutations(list.id);

  const canEdit = ['admin', 'super_admin', 'management', 'foreman'].includes(user?.role || '');

  const completedTasks = tasks.filter((t) => t.is_done).length;

  const handleAddTask = (title: string) => {
    createTask.mutate({ title, list_id: list.id });
  };

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
      <TaskListHeader
        list={list}
        totalTasks={tasks.length}
        completedTasks={completedTasks}
      />
      
      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="px-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No tasks yet. Add one below!
          </p>
        ) : (
          tasks.map((task) => (
            <TaskTreeItem
              key={task.id}
              task={task}
              onToggle={(id, isDone) => toggleComplete.mutate({ id, is_done: isDone })}
              onUpdate={(id, updates) => updateTask.mutate({ id, updates })}
              onDelete={(id) => deleteTask.mutate(id)}
              onAssign={(itemId, userId) => assignEmployee.mutate({ item_id: itemId, user_id: userId })}
              onUnassign={(itemId, userId) => unassignEmployee.mutate({ item_id: itemId, user_id: userId })}
              canEdit={canEdit}
            />
          ))
        )}
      </div>
      {canEdit && (
        <div className="p-4 border-t bg-muted/30">
          <TaskQuickAdd
            onAdd={handleAddTask}
            disabled={createTask.isPending}
          />
        </div>
      )}
    </Card>
  );
};
