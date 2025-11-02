import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Inbox, ChevronLeft } from 'lucide-react';
import { TaskListCard } from './TaskListCard';
import { CreateListDialog } from './CreateListDialog';
import { EditListDialog } from './EditListDialog';
import { useDailyTasksByDate } from '@/hooks/daily-tasks/useDailyTasksByDate';
import { useTaskListMutations } from '@/hooks/daily-tasks/useTaskListMutations';
import { useTaskMutations } from '@/hooks/daily-tasks/useTaskMutations';
import { format } from 'date-fns';
import { DailyTaskList } from '@/types/daily-tasks';
import { Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';

interface DateBasedTaskViewProps {
  jobsiteId: string;
  companyId: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBackToCalendar: () => void;
}

export const DateBasedTaskView: React.FC<DateBasedTaskViewProps> = ({
  jobsiteId,
  companyId,
  selectedDate,
  onDateChange,
  onBackToCalendar,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<DailyTaskList | null>(null);
  const [duplicatingListId, setDuplicatingListId] = useState<string | null>(null);

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: lists = [], isLoading } = useDailyTasksByDate(jobsiteId, formattedDate);
  const { createList, updateList, deleteList, closeList, duplicateList } = useTaskListMutations();
  
  // Use first list for mutations or empty string
  const firstListId = lists.length > 0 ? lists[0].id : '';
  const { toggleComplete, updateTask, deleteTask, createTask } = useTaskMutations(firstListId);

  const handleCreateList = (data: { title: string; for_date: string }) => {
    createList.mutate({
      ...data,
      jobsite_id: jobsiteId,
      company_id: companyId,
    });
  };

  const handleUpdateList = (data: { title: string; for_date: string }) => {
    if (editingList) {
      updateList.mutate({
        id: editingList.id,
        updates: data,
      });
    }
  };

  const handleDuplicateList = (newDate: string) => {
    if (duplicatingListId) {
      duplicateList.mutate({
        listId: duplicatingListId,
        newDate,
      });
      setDuplicatingListId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBackToCalendar} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Calendar
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">
              Tasks for {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Change Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </div>

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Task Lists</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Create your first task list for this date to start organizing work.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Task List
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <TaskListCard
              key={list.id}
              list={list}
              onToggleTask={(taskId, isDone) => toggleComplete.mutate({ id: taskId, is_done: isDone })}
              onUpdateTask={(taskId, updates) => updateTask.mutate({ id: taskId, updates })}
              onDeleteTask={(taskId) => deleteTask.mutate(taskId)}
              onEditList={() => {
                setEditingList(list);
                setEditDialogOpen(true);
              }}
              onDuplicateList={() => setDuplicatingListId(list.id)}
              onCloseList={() => closeList.mutate(list.id)}
              onDeleteList={() => deleteList.mutate(list.id)}
              canEdit={true}
            />
          ))}
        </div>
      )}

      <CreateListDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateList}
        defaultDate={formattedDate}
        isLoading={createList.isPending}
      />

      <EditListDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdateList}
        list={editingList}
        isLoading={updateList.isPending}
      />

      {duplicatingListId && (
        <CreateListDialog
          open={!!duplicatingListId}
          onOpenChange={(open) => !open && setDuplicatingListId(null)}
          onSubmit={(data) => handleDuplicateList(data.for_date)}
          isLoading={duplicateList.isPending}
        />
      )}
    </div>
  );
};
