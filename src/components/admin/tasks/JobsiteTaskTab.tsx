import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ListTodo, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AdvancedTaskList } from './AdvancedTaskList';
import { AdvancedTaskForm } from './AdvancedTaskForm';
import { TaskFilters, useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JobsiteTaskTabProps {
  jobsiteId: string;
  isAdmin: boolean;
}

export default function JobsiteTaskTab({ jobsiteId, isAdmin }: JobsiteTaskTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});

  const { data: allTasks = [] } = useJobsiteTasksAdvanced(jobsiteId, {});

  // Calculate statistics
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = allTasks.filter(t => {
    if (t.status === 'completed') return false;
    const endDate = new Date(t.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  }).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select
            value={typeof filters.status === 'string' ? filters.status : 'all'}
            onValueChange={(value) =>
              setFilters(prev => ({
                ...prev,
                status: value === 'all' ? undefined : (value as 'pending' | 'in_progress' | 'completed')
              }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeof filters.priority === 'string' ? filters.priority : 'all'}
            onValueChange={(value) =>
              setFilters(prev => ({
                ...prev,
                priority: value === 'all' ? undefined : (value as 'low' | 'medium' | 'high')
              }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          {(filters.status || filters.priority) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* Task List */}
      <AdvancedTaskList
        jobsiteId={jobsiteId}
        filters={filters}
        isAdmin={isAdmin}
      />

      {/* Create Task Dialog */}
      {isAdmin && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <AdvancedTaskForm
              jobsiteId={jobsiteId}
              onCancel={() => setShowCreateDialog(false)}
              onSuccess={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
