import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Loader2, ClipboardList } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { DailyTasksSummaryCards } from './DailyTasksSummaryCards';
import { useDateSpecificStats } from '@/hooks/daily-tasks/useDateSpecificStats';
import { useDailyTasksByDate } from '@/hooks/daily-tasks/useDailyTasksByDate';
import { useTaskItemMutations } from '@/hooks/daily-tasks/useTaskItemMutations';
import { useTaskListMutations } from '@/hooks/daily-tasks/useTaskListMutations';
import { TaskListCard } from './TaskListCard';
import { CreateListDialog } from './CreateListDialog';
import { EditListDialog } from './EditListDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
interface SingleDateViewProps {
  jobsiteId: string;
  companyId: string;
  selectedDate: string;
}
export const SingleDateView: React.FC<SingleDateViewProps> = ({
  jobsiteId,
  companyId,
  selectedDate
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const {
    data: stats,
    isLoading: statsLoading
  } = useDateSpecificStats(jobsiteId, companyId, selectedDate);
  const {
    data: listsWithTasks,
    isLoading: listsLoading
  } = useDailyTasksByDate(jobsiteId, selectedDate);
  const {
    toggleTask,
    updateTask,
    deleteTask,
    addTask
  } = useTaskItemMutations();
  const {
    createList,
    updateList,
    closeList,
    deleteList,
    duplicateList
  } = useTaskListMutations();
  const dateFormatted = format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy');
  const handleBack = () => {
    const currentTab = searchParams.get('tab') || 'daily-tasks';
    navigate(`?tab=${currentTab}&jobsiteId=${jobsiteId}`);
  };
  const handleToggleTask = (taskId: string, isDone: boolean) => {
    toggleTask.mutate({
      taskId,
      isDone
    });
  };
  const handleUpdateTask = (taskId: string, updates: {
    title: string;
  }) => {
    updateTask.mutate({
      taskId,
      updates
    });
  };
  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId);
    }
  };
  const handleEditList = (listId: string) => {
    setEditingListId(listId);
  };
  const handleDuplicateList = (listId: string) => {
    const list = listsWithTasks?.find(l => l.id === listId);
    if (list) {
      duplicateList.mutate({
        listId: list.id,
        newDate: list.for_date,
        newJobsiteId: list.jobsite_id
      });
    }
  };
  const handleCloseList = (listId: string) => {
    closeList.mutate(listId);
  };
  const handleDeleteList = (listId: string) => {
    if (confirm('Are you sure you want to delete this list and all its tasks?')) {
      deleteList.mutate(listId);
    }
  };
  const editingList = listsWithTasks?.find(l => l.id === editingListId);
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{dateFormatted}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Daily tasks for this date
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Task List
        </Button>
      </div>

      {/* Summary Cards */}
      <DailyTasksSummaryCards totalTasks={stats?.totalTasks || 0} completedTasks={stats?.completedTasks || 0} incompleteTasks={stats?.incompleteTasks || 0} completionPercentage={stats?.completionPercentage || 0} isLoading={statsLoading} />

      {/* Overall Progress */}
      {stats && stats.totalTasks > 0 && <Card>
          
        </Card>}

      {/* Task Lists */}
      {listsLoading ? <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div> : !listsWithTasks || listsWithTasks.length === 0 ? <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Task Lists for This Date
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Create a task list to get started organizing work for {dateFormatted}.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Task List
            </Button>
          </CardContent>
        </Card> : <div className="space-y-4">
          {listsWithTasks.map(list => <TaskListCard key={list.id} list={list} onToggleTask={handleToggleTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onEditList={() => handleEditList(list.id)} onDuplicateList={() => handleDuplicateList(list.id)} onCloseList={() => handleCloseList(list.id)} onDeleteList={() => handleDeleteList(list.id)} canEdit={true} />)}
        </div>}

      {/* Dialogs */}
      <CreateListDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onSubmit={data => {
      createList.mutate({
        title: data.title,
        jobsite_id: jobsiteId,
        company_id: companyId,
        for_date: data.for_date
      });
      setIsCreateDialogOpen(false);
    }} isLoading={createList.isPending} />

      {editingList && <EditListDialog open={!!editingListId} onOpenChange={open => !open && setEditingListId(null)} list={editingList} onSubmit={data => {
      updateList.mutate({
        id: editingListId!,
        updates: {
          title: data.title,
          for_date: data.for_date
        }
      });
      setEditingListId(null);
    }} isLoading={updateList.isPending} />}
    </div>;
};