import React, { useState, useMemo } from 'react';
import { TaskWithList } from '@/hooks/daily-tasks/useAllJobsiteTasks';
import { TaskItem } from './TaskItem';
import { TaskQuickAdd } from './TaskQuickAdd';
import { cn } from '@/lib/utils';

interface TaskListViewProps {
  tasks: TaskWithList[];
  onToggle: (id: string, isDone: boolean) => void;
  onUpdate: (id: string, updates: { title: string }) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string, listId: string) => void;
  canEdit?: boolean;
  isLoading?: boolean;
}

type FilterTab = 'all' | 'done' | 'not-done';

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onToggle,
  onUpdate,
  onDelete,
  onAdd,
  canEdit = true,
  isLoading = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'done':
        return tasks.filter((task) => task.is_done);
      case 'not-done':
        return tasks.filter((task) => !task.is_done);
      default:
        return tasks;
    }
  }, [tasks, activeFilter]);

  const handleQuickAdd = (title: string) => {
    // Add to the first list by default
    if (tasks.length > 0) {
      onAdd(title, tasks[0].list_id);
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.is_done).length;
    const notDone = total - done;
    return { total, done, notDone };
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/30 pb-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeFilter === 'all'
              ? 'bg-background text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setActiveFilter('not-done')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeFilter === 'not-done'
              ? 'bg-background text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          Not Done ({stats.notDone})
        </button>
        <button
          onClick={() => setActiveFilter('done')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
            activeFilter === 'done'
              ? 'bg-background text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          Done ({stats.done})
        </button>
      </div>

      {/* Task List */}
      <div className="bg-background rounded-lg border border-border/30 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {activeFilter === 'all' 
              ? 'No tasks yet. Add one below!'
              : activeFilter === 'done'
              ? 'No completed tasks yet.'
              : 'No pending tasks!'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          ))
        )}

        {/* Quick Add at Bottom */}
        {canEdit && tasks.length > 0 && (
          <div className="p-4 border-t border-border/30 bg-muted/20">
            <TaskQuickAdd onAdd={handleQuickAdd} />
          </div>
        )}
      </div>
    </div>
  );
};
