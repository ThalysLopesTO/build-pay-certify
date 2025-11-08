import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';

interface TaskStatisticsCardsProps {
  jobsites: Array<{ id: string; name: string }>;
}

export function TaskStatisticsCards({ jobsites }: TaskStatisticsCardsProps) {
  // Fetch tasks for all jobsites
  const taskQueries = jobsites.map(jobsite => 
    useJobsiteTasksAdvanced(jobsite.id, {})
  );

  // Aggregate all tasks
  const allTasks = taskQueries.flatMap(query => query.data || []);

  // Calculate statistics
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = allTasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.task_date) return false;
    const taskDate = new Date(t.task_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return taskDate < today;
  }).length;

  return (
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
  );
}
