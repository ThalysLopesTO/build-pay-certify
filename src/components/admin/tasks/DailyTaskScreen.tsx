import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Download,
} from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import { useJobsiteTasksAdvanced, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { format, startOfToday, subDays, addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {  Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DailyTaskCard } from './DailyTaskCard';
import { DailyTaskForm } from './DailyTaskForm';
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
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { data: jobsites = [] } = useJobsites('active');
  const jobsite = jobsites.find((j) => j.id === jobsiteId);
  const { settings } = useCompanySettings();
  const companyTimezone = settings?.timezone || DEFAULT_TIMEZONE;
  const { toast } = useToast();
  const { bulkUpdateTasks } = useTaskActions();

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

  const handleQuickDateChange = (type: 'yesterday' | 'today' | 'tomorrow') => {
    if (type === 'today') {
      setSelectedDate(startOfToday());
    } else if (type === 'yesterday') {
      setSelectedDate(subDays(startOfToday(), 1));
    } else {
      setSelectedDate(addDays(startOfToday(), 1));
    }
    setSelectedTaskIds(new Set()); // Clear selection when changing dates
  };

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
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map(t => t.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set());
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
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/dashboard?tab=tasks')}
            className="md:flex"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{jobsite.name}</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Daily Task Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop: Add Task Button */}
          <Button onClick={() => setShowCreateForm(true)} className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={format(selectedDate, 'yyyy-MM-dd') === format(subDays(startOfToday(), 1), 'yyyy-MM-dd') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickDateChange('yesterday')}
        >
          Yesterday
        </Button>
        <Button
          variant={format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickDateChange('today')}
        >
          Today
        </Button>
        <Button
          variant={format(selectedDate, 'yyyy-MM-dd') === format(addDays(startOfToday(), 1), 'yyyy-MM-dd') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickDateChange('tomorrow')}
        >
          Tomorrow
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Custom Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Cards (Desktop Only) */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <ListTodo className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueTasks}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks for Selected Date */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <ListTodo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Tasks for {format(selectedDate, 'MMMM dd, yyyy')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Create a task to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={tasks.length > 0 && selectedTaskIds.size === tasks.length}
                  onCheckedChange={handleSelectAll}
                  className="h-5 w-5"
                />
                <h3 className="text-lg font-semibold">
                  {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                </h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedTaskIds.size > 0 
                  ? `${selectedTaskIds.size} selected` 
                  : `${completedTasks} of ${totalTasks} completed`}
              </span>
            </div>
            <div className="divide-y divide-border rounded-lg border bg-card">
              {tasks.map((task) => (
                <DailyTaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingTaskId(task.id)}
                  isSelected={selectedTaskIds.has(task.id)}
                  onToggleSelection={() => handleToggleTaskSelection(task.id)}
                />
              ))}
            </div>
          </div>
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

      {/* Mobile FAB */}
      <Button
        onClick={() => setShowCreateForm(true)}
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Create/Edit Task Form */}
      {isDesktop ? (
        <Dialog open={showCreateForm || !!editingTaskId} onOpenChange={(open) => {
          if (!open) {
            setShowCreateForm(false);
            setEditingTaskId(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            </DialogHeader>
            <DailyTaskForm
              jobsiteId={jobsiteId || ''}
              taskId={editingTaskId || undefined}
              defaultDate={format(selectedDate, 'yyyy-MM-dd')}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingTaskId(null);
              }}
              onSuccess={() => {
                setShowCreateForm(false);
                setEditingTaskId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showCreateForm || !!editingTaskId} onOpenChange={(open) => {
          if (!open) {
            setShowCreateForm(false);
            setEditingTaskId(null);
          }
        }}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-8">
              <DailyTaskForm
                jobsiteId={jobsiteId || ''}
                taskId={editingTaskId || undefined}
                defaultDate={format(selectedDate, 'yyyy-MM-dd')}
                onCancel={() => {
                  setShowCreateForm(false);
                  setEditingTaskId(null);
                }}
                onSuccess={() => {
                  setShowCreateForm(false);
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
