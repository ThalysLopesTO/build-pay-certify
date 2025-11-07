import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { TaskFilterPanel } from './TaskFilterPanel';
import { AdvancedTaskList } from './AdvancedTaskList';
import { AdvancedTaskForm } from './AdvancedTaskForm';
import { TaskFilters, useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';
import { useJobsites } from '@/hooks/useJobsites';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdvancedTaskManagement() {
  const [selectedJobsite, setSelectedJobsite] = useState<string>('all');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: jobsites = [] } = useJobsites();
  const { data: tasks = [] } = useJobsiteTasksAdvanced(
    selectedJobsite === 'all' ? undefined : selectedJobsite,
    filters
  );

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const endDate = new Date(t.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  }).length;

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all tasks across your jobsites
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <ListTodo className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            {totalTasks > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((completedTasks / totalTasks) * 100)}% complete
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobsite Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jobsite Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Select a jobsite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobsites</SelectItem>
              {jobsites.map((jobsite) => (
                <SelectItem key={jobsite.id} value={jobsite.id}>
                  {jobsite.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Filter Panel */}
      <TaskFilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedJobsite === 'all' ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Please select a specific jobsite to view and manage tasks</p>
            </div>
          ) : (
            <AdvancedTaskList
              jobsiteId={selectedJobsite}
              filters={filters}
              isAdmin={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          {selectedJobsite !== 'all' ? (
            <AdvancedTaskForm
              jobsiteId={selectedJobsite}
              onCancel={() => setShowCreateDialog(false)}
              onSuccess={() => setShowCreateDialog(false)}
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Please select a specific jobsite to create a task
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
