import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDailyTaskLists } from '@/hooks/daily-tasks/useDailyTaskLists';
import { useDailyTaskItems } from '@/hooks/daily-tasks/useDailyTaskItems';
import { useTaskProgress } from '@/hooks/daily-tasks/useTaskProgress';
import { ArrowLeft, Plus } from 'lucide-react';
import { formatDateFromDB } from '@/utils/dateUtils';
import { TaskTree } from './TaskTree';
import { TaskQuickAdd } from './TaskQuickAdd';

interface DailyTaskListViewProps {
  jobsiteId: string;
  listId: string;
}

export const DailyTaskListView = ({ jobsiteId, listId }: DailyTaskListViewProps) => {
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data: lists } = useDailyTaskLists({ jobsiteId });
  const { data: items, isLoading: itemsLoading } = useDailyTaskItems(listId);
  const progress = useTaskProgress(items || []);

  const stats = useMemo(() => {
    const countLeafTasks = (items: any[]) => {
      let total = 0;
      let completed = 0;
      let pending = 0;
      
      const traverse = (tasks: any[]) => {
        tasks.forEach(task => {
          if (!task.children || task.children.length === 0) {
            total++;
            if (task.is_done) {
              completed++;
            } else {
              pending++;
            }
          } else {
            traverse(task.children);
          }
        });
      };
      
      traverse(items);
      return { total, completed, pending };
    };
    
    return countLeafTasks(items || []);
  }, [items]);

  const currentList = lists?.find(l => l.id === listId);

  if (!currentList) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">List not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/dashboard?tab=daily-tasks&jobsiteId=${jobsiteId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentList.title}</h1>
            <p className="text-muted-foreground mt-1">
              {formatDateFromDB(currentList.for_date, 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowQuickAdd(!showQuickAdd)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {progress.completed} of {progress.total} tasks completed
            </span>
            <span className="font-semibold">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} />
        </CardContent>
      </Card>

      {showQuickAdd && (
        <TaskQuickAdd
          listId={listId}
          onSuccess={() => setShowQuickAdd(false)}
          onCancel={() => setShowQuickAdd(false)}
        />
      )}

      <Card>
        <CardContent className="pt-6">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading tasks...</div>
            </div>
          ) : items && items.length > 0 ? (
            <TaskTree items={items} listId={listId} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No tasks yet</p>
              <Button onClick={() => setShowQuickAdd(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
