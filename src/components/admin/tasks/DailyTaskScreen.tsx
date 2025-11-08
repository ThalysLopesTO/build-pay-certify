import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  ListTodo,
  MoreVertical,
  Download,
  Trash2,
} from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import { useJobsiteTasksAdvanced, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { format, startOfToday, addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { TaskItem } from './TaskItem';
import { DailyTaskForm } from './DailyTaskForm';
import { DraggableTaskList } from './DraggableTaskList';
import { QuickTaskComposer } from './quick-create/QuickTaskComposer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatInCompanyTimezone, DEFAULT_TIMEZONE } from '@/utils/timezone';
import { useToast } from '@/hooks/use-toast';

export function DailyTaskScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobsiteId = searchParams.get('jobsite') || undefined;
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false);
  const [bulkMoveTargetDate, setBulkMoveTargetDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'completed' | 'overdue'>('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { data: jobsites = [] } = useJobsites('active');
  const jobsite = jobsites.find((j) => j.id === jobsiteId);
  const { settings } = useCompanySettings();
  const companyTimezone = settings?.timezone || DEFAULT_TIMEZONE;
  const { toast } = useToast();
  const { bulkUpdateTasks, bulkReorderTasks } = useTaskActions();

  // Filter tasks by selected date
  const { data: tasks = [], isLoading } = useJobsiteTasksAdvanced(jobsiteId || '', {
    taskDate: format(selectedDate, 'yyyy-MM-dd')
  });

  // Get today in company timezone for overdue calculation
  const todayInCompanyTZ = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);

  // Calculate stats for selected date only
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'done' || !t.task_date) return false;
    // Task is overdue if its date is before today in company timezone
    return t.task_date < todayInCompanyTZ;
  }).length;

  // Filter tasks based on status
  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return task.status !== 'done';
    if (statusFilter === 'completed') return task.status === 'done';
    if (statusFilter === 'overdue') {
      return task.task_date && task.task_date < todayInCompanyTZ && task.status !== 'done';
    }
    return true;
  });

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const handleMoveTaskToTomorrow = async (taskId: string) => {
    const tomorrowDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await bulkUpdateTasks.mutateAsync({
      taskIds: [taskId],
      taskData: { task_date: tomorrowDate }
    });
    toast({
      title: 'Task Moved',
      description: 'Task moved to tomorrow',
    });
  };

  const handleBulkMove = async () => {
    if (!bulkMoveTargetDate) return;
    
    const todayInCompanyTZ = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);
    const targetDateStr = format(bulkMoveTargetDate, 'yyyy-MM-dd');
    
    // Validate: cannot move to past
    if (targetDateStr < todayInCompanyTZ) {
      toast({
        title: 'Invalid Date',
        description: 'Cannot move tasks to a past date',
        variant: 'destructive',
      });
      return;
    }
    
    // Use bulk update mutation
    try {
      await bulkUpdateTasks.mutateAsync({
        taskIds: Array.from(selectedTaskIds),
        taskData: { task_date: targetDateStr }
      });
      
      toast({
        title: 'Tasks Moved',
        description: `${selectedTaskIds.size} task(s) moved to ${format(bulkMoveTargetDate, 'MMMM dd, yyyy')}`,
      });
      
      setSelectedTaskIds(new Set());
      setShowBulkMoveDialog(false);
      setBulkMoveTargetDate(undefined);
    } catch (error) {
      toast({
        title: 'Error Moving Tasks',
        description: 'Some tasks failed to move. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReorder = async (updates: { taskId: string; sortOrder: number }[]) => {
    await bulkReorderTasks.mutateAsync({ updates });
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!jobsite) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Jobsite not found</p>
          <Button onClick={() => navigate('/admin/dashboard?tab=tasks')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobsites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Modern Clean Header */}
      <div className="space-y-2 mb-6">
        {/* Back button + Actions on same line */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/dashboard?tab=tasks')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="hidden md:flex rounded-full px-6"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Task
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Large Title Section */}
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            {format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd') 
              ? "Today's Tasks" 
              : format(selectedDate, 'EEEE')}
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            {format(selectedDate, 'EEEE, d MMMM yyyy')}
          </p>
          <p className="text-sm text-muted-foreground">
            {jobsite.name}
          </p>
        </div>
      </div>

      {/* Horizontal Date Picker - Similar to reference */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {/* Generate 7 days: 3 before, today, 3 after */}
          {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
            const date = addDays(startOfToday(), offset);
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = format(selectedDate, 'yyyy-MM-dd') === dateStr;
            const isToday = format(startOfToday(), 'yyyy-MM-dd') === dateStr;
            
            return (
              <button
                key={offset}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTaskIds(new Set());
                }}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-xl transition-all',
                  'border-2 hover:border-primary/50',
                  isSelected 
                    ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' 
                    : 'bg-card border-border hover:bg-muted',
                  isToday && !isSelected && 'border-primary/30'
                )}
              >
                <span className={cn(
                  'text-xs font-medium uppercase tracking-wide',
                  isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-muted-foreground'
                )}>
                  {format(date, 'EEE')}
                </span>
                <span className={cn(
                  'text-2xl font-bold mt-1',
                  isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'
                )}>
                  {format(date, 'd')}
                </span>
              </button>
            );
          })}
          
          {/* Custom Date Picker Button */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                'flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-xl transition-all',
                'border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted'
              )}>
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs mt-1 text-muted-foreground">More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setSelectedTaskIds(new Set());
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-6 border-b scrollbar-hide">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2',
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          All
          <Badge className={cn(
            'border-0',
            statusFilter === 'all' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>{totalTasks}</Badge>
        </button>
        
        <button
          onClick={() => setStatusFilter('open')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2',
            statusFilter === 'open'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Open
          <Badge className={cn(
            'border-0',
            statusFilter === 'open' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            {tasks.filter(t => t.status !== 'done').length}
          </Badge>
        </button>
        
        <button
          onClick={() => setStatusFilter('completed')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2',
            statusFilter === 'completed'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Completed
          <Badge className={cn(
            'border-0',
            statusFilter === 'completed' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            {completedTasks}
          </Badge>
        </button>
        
        <button
          onClick={() => setStatusFilter('overdue')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2',
            statusFilter === 'overdue'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Overdue
          <Badge className={cn(
            'border-0',
            statusFilter === 'overdue' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            {overdueTasks}
          </Badge>
        </button>
      </div>

      {/* Task List - Clean Design */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <ListTodo className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No tasks {statusFilter !== 'all' && statusFilter}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {statusFilter === 'all' 
                ? `Create your first task for ${format(selectedDate, 'MMMM d')}`
                : `All tasks are ${statusFilter === 'completed' ? 'incomplete' : 'up to date'}!`
              }
            </p>
            {statusFilter === 'all' && (
              <Button onClick={() => setShowCreateForm(true)} className="rounded-full px-6">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Select All Header - Only show when viewing all */}
            {statusFilter === 'all' && (
              <div className="flex items-center justify-between py-3 px-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length}
                    onCheckedChange={handleSelectAll}
                    className="h-5 w-5"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {selectedTaskIds.size > 0 
                      ? `${selectedTaskIds.size} selected` 
                      : 'Select all'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {completedTasks} of {totalTasks} completed
                </span>
              </div>
            )}
            
            {/* Task Items with drag-and-drop */}
            <DraggableTaskList
              tasks={filteredTasks}
              expandedTaskIds={expandedTaskIds}
              selectedTaskIds={selectedTaskIds}
              onToggle={(taskId) => {
                setExpandedTaskIds(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(taskId)) {
                    newSet.delete(taskId);
                  } else {
                    newSet.add(taskId);
                  }
                  return newSet;
                });
              }}
              onEdit={(taskId) => setEditingTaskId(taskId)}
              onDuplicate={(taskId) => {
                // Duplicate functionality would go here
                toast({
                  title: 'Duplicate',
                  description: 'Task duplication coming soon',
                });
              }}
              onMoveToTomorrow={handleMoveTaskToTomorrow}
              onDelete={(taskId) => {
                // Delete functionality would go here
                toast({
                  title: 'Delete',
                  description: 'Task deletion coming soon',
                });
              }}
              onSelect={handleToggleTaskSelection}
              onReorder={handleReorder}
            />
          </>
        )}
      </div>

      {/* Bulk Action Toolbar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground shadow-lg border-t z-50 md:left-64">
          <div className="container max-w-7xl mx-auto p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold">
                {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSelection}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowBulkMoveDialog(true)}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Move to Date
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB - Cleaner design */}
      <Button
        onClick={() => setShowCreateForm(true)}
        className="md:hidden fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-40 bg-foreground text-background hover:bg-foreground/90"
        size="icon"
      >
        <Plus className="w-7 h-7" />
      </Button>

      {/* Quick Task Composer */}
      <QuickTaskComposer
        open={showCreateForm && !editingTaskId}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateForm(false);
          }
        }}
        jobsiteId={jobsiteId || ''}
        jobsiteName={jobsite?.name || 'Unknown Jobsite'}
        defaultDate={format(selectedDate, 'yyyy-MM-dd')}
      />

      {/* Edit Task Form (Old form only for editing existing tasks) */}
      {isDesktop ? (
        <Dialog open={!!editingTaskId} onOpenChange={(open) => {
          if (!open) {
            setEditingTaskId(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <DailyTaskForm
              jobsiteId={jobsiteId || ''}
              taskId={editingTaskId || undefined}
              defaultDate={format(selectedDate, 'yyyy-MM-dd')}
              onCancel={() => {
                setEditingTaskId(null);
              }}
              onSuccess={() => {
                setEditingTaskId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={!!editingTaskId} onOpenChange={(open) => {
          if (!open) {
            setEditingTaskId(null);
          }
        }}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Edit Task</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-8">
              <DailyTaskForm
                jobsiteId={jobsiteId || ''}
                taskId={editingTaskId || undefined}
                defaultDate={format(selectedDate, 'yyyy-MM-dd')}
                onCancel={() => {
                  setEditingTaskId(null);
                }}
                onSuccess={() => {
                  setEditingTaskId(null);
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Bulk Move Dialog */}
      <Dialog open={showBulkMoveDialog} onOpenChange={setShowBulkMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Move {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select a date to move the selected tasks to:
            </p>
            <Calendar
              mode="single"
              selected={bulkMoveTargetDate}
              onSelect={setBulkMoveTargetDate}
              disabled={(date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const todayInCompanyTZ = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);
                return dateStr < todayInCompanyTZ;
              }}
              className="rounded-md border"
            />
            {bulkMoveTargetDate && (
              <p className="text-sm font-medium">
                Moving to: {format(bulkMoveTargetDate, 'EEEE, MMMM dd, yyyy')}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkMoveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkMove}
              disabled={!bulkMoveTargetDate}
            >
              Move {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
