import { useJobsiteTasksAdvanced, TaskFilters } from '@/hooks/useJobsiteTasksAdvanced';
import { AdvancedTaskCard } from './AdvancedTaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Grid, List, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AdvancedTaskListProps {
  jobsiteId: string;
  filters: TaskFilters;
  isAdmin: boolean;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleTaskStatus?: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => void;
}

export function AdvancedTaskList({ 
  jobsiteId, 
  filters, 
  isAdmin,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus
}: AdvancedTaskListProps) {
  const { data: tasks, isLoading, error, refetch } = useJobsiteTasksAdvanced(jobsiteId, filters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Tasks</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {error.message || 'Failed to load tasks. Please try again.'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    const hasActiveFilters = Object.values(filters).some(value => 
      value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
    );

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <List className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {hasActiveFilters ? 'No Tasks Match Filters' : 'No Tasks Yet'}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {hasActiveFilters 
            ? 'Try adjusting your filters to see more tasks.'
            : 'Create your first task to get started with task management.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with view toggle and task count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} found
        </div>
        
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-3"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-3"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task List/Grid */}
      <div className={cn(
        viewMode === 'grid' 
          ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
          : "space-y-4"
      )}>
        {tasks.map((task) => (
          <AdvancedTaskCard
            key={task.id}
            task={task}
            isAdmin={isAdmin}
            onEdit={onEditTask ? () => onEditTask(task.id) : undefined}
            onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
            onToggleStatus={onToggleTaskStatus ? (status) => onToggleTaskStatus(task.id, status) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
