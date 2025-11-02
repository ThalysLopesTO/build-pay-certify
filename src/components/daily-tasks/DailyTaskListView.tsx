import React, { useState } from 'react';
import { usePaginatedTaskLists } from '@/hooks/daily-tasks/usePaginatedTaskLists';
import { useTaskItemMutations } from '@/hooks/daily-tasks/useTaskItemMutations';
import { useTaskListMutations } from '@/hooks/daily-tasks/useTaskListMutations';
import { DateGroupCard } from './DateGroupCard';
import { TaskStatusTabs } from './TaskStatusTabs';
import { CreateListDialog } from './CreateListDialog';
import { EditListDialog } from './EditListDialog';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Plus, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

interface DailyTaskListViewProps {
  jobsiteId: string;
  companyId: string;
}

export const DailyTaskListView: React.FC<DailyTaskListViewProps> = ({
  jobsiteId,
  companyId,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [expandedDateId, setExpandedDateId] = useState<string | null>(null);

  const { data, isLoading } = usePaginatedTaskLists(
    jobsiteId,
    companyId,
    activeTab,
    currentPage,
    10
  );

  const { toggleTask, updateTask, deleteTask, addTask } = useTaskItemMutations();
  const { createList, updateList, closeList, deleteList, duplicateList } = useTaskListMutations();

  const handleToggleTask = (taskId: string, isDone: boolean) => {
    toggleTask.mutate({ taskId, isDone });
  };

  const handleUpdateTask = (taskId: string, updates: { title: string }) => {
    updateTask.mutate({ taskId, updates });
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(taskId);
    }
  };

  const handleAddTask = (listId: string, title: string) => {
    addTask.mutate({ listId, title });
  };

  const handleEditList = (listId: string) => {
    setEditingListId(listId);
  };

  const handleDuplicateList = (listId: string) => {
    const list = data?.dateGroups
      .flatMap((dg) => dg.lists)
      .find((l) => l.id === listId);
    
    if (list) {
      duplicateList.mutate({
        listId: list.id,
        newDate: list.for_date,
        newJobsiteId: list.jobsite_id,
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (data?.totalPages || 1)) {
      setCurrentPage(page);
      setExpandedDateId(null); // Collapse all when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleDate = (dateId: string) => {
    setExpandedDateId(prev => prev === dateId ? null : dateId);
  };

  const editingList = data?.dateGroups
    .flatMap((dg) => dg.lists)
    .find((l) => l.id === editingListId);

  // Calculate stats for tabs
  const allStats = {
    all: data?.totalLists || 0,
    pending: 0,
    completed: 0,
  };

  if (data) {
    data.dateGroups.forEach((dg) => {
      dg.lists.forEach((list) => {
        const completed = list.tasks.filter((t) => t.is_done).length;
        if (completed < list.tasks.length) {
          allStats.pending++;
        } else if (list.tasks.length > 0 && completed === list.tasks.length) {
          allStats.completed++;
        }
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button and Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Task List
        </Button>

        <div className="w-full sm:w-auto sm:min-w-[400px]">
          <TaskStatusTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            stats={allStats}
          />
        </div>
      </div>

      {/* Task Lists */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !data || data.dateGroups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {activeTab === 'all'
                ? 'No Task Lists Yet'
                : activeTab === 'pending'
                ? 'All Caught Up!'
                : 'No Completed Tasks'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {activeTab === 'all'
                ? 'Get started by creating your first task list to organize your daily work.'
                : activeTab === 'pending'
                ? 'Great work! You have no pending tasks at the moment.'
                : 'Complete some tasks to see them here.'}
            </p>
            {activeTab === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.dateGroups.map((dateGroup) => (
            <DateGroupCard
              key={dateGroup.date}
              dateGroup={dateGroup}
              isExpanded={expandedDateId === dateGroup.date}
              onToggle={() => handleToggleDate(dateGroup.date)}
              onToggleTask={handleToggleTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
              onEditList={handleEditList}
              onDuplicateList={handleDuplicateList}
              onCloseList={handleCloseList}
              onDeleteList={handleDeleteList}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Dialogs */}
      <CreateListDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(data) => {
          createList.mutate({
            title: data.title,
            jobsite_id: jobsiteId,
            company_id: companyId,
            for_date: data.for_date,
          });
          setIsCreateDialogOpen(false);
        }}
        isLoading={createList.isPending}
      />

      {editingList && (
        <EditListDialog
          open={!!editingListId}
          onOpenChange={(open) => !open && setEditingListId(null)}
          list={editingList}
          onSubmit={(data) => {
            updateList.mutate({
              id: editingListId!,
              updates: {
                title: data.title,
                for_date: data.for_date,
              },
            });
            setEditingListId(null);
          }}
          isLoading={updateList.isPending}
        />
      )}
    </div>
  );
};
