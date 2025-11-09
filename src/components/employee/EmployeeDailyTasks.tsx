import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';
import { EmployeeTaskCard } from './EmployeeTaskCard';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type StatusFilter = 'all' | 'open' | 'completed' | 'overdue';

export default function EmployeeDailyTasks() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Fetch jobsites where employee is assigned
  const { data: jobsiteAssignments, isLoading: jobsitesLoading } = useQuery({
    queryKey: ['employee-jobsites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('jobsite_workers')
        .select('jobsite_id, jobsites(id, name)')
        .eq('user_id', user.id)
        .eq('jobsites.status', 'active');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const jobsiteIds = jobsiteAssignments?.map(ja => ja.jobsite_id) || [];

  // Fetch tasks from all assigned jobsites
  const taskQueries = jobsiteIds.map(jobsiteId => 
    useJobsiteTasksAdvanced(jobsiteId, {
      taskDate: format(selectedDate, 'yyyy-MM-dd'),
      assigneeIds: user?.id ? [user.id] : [],
    })
  );

  // Merge all tasks and include jobsite info
  const allTasks = taskQueries.flatMap((query, idx) => {
    if (!query.data) return [];
    const jobsiteInfo = jobsiteAssignments?.[idx];
    const jobsiteName = jobsiteInfo?.jobsites ? (jobsiteInfo.jobsites as any).name : 'Unknown Jobsite';
    return query.data.map(task => ({
      ...task,
      jobsiteName,
    }));
  });

  const isLoading = jobsitesLoading || taskQueries.some(q => q.isLoading);

  // Filter tasks by status
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const filteredTasks = allTasks.filter(task => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return task.status !== 'done';
    if (statusFilter === 'completed') return task.status === 'done';
    if (statusFilter === 'overdue') {
      return task.task_date < todayStr && task.status !== 'done';
    }
    return true;
  });

  // Sort tasks: overdue first, then by due_time, completed last
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;

    // Overdue tasks go to top
    const aOverdue = a.task_date < todayStr && a.status !== 'done';
    const bOverdue = b.task_date < todayStr && b.status !== 'done';
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Sort by due_time
    if (a.due_time && b.due_time) {
      return a.due_time.localeCompare(b.due_time);
    }
    if (a.due_time) return -1;
    if (b.due_time) return 1;

    return 0;
  });

  // Count stats
  const openCount = allTasks.filter(t => t.status !== 'done').length;
  const completedCount = allTasks.filter(t => t.status === 'done').length;
  const overdueCount = allTasks.filter(t => t.task_date < todayStr && t.status !== 'done').length;

  // Week navigation
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToToday = () => setSelectedDate(new Date());
  const goToPrevWeek = () => setSelectedDate(addDays(selectedDate, -7));
  const goToNextWeek = () => setSelectedDate(addDays(selectedDate, 7));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allTasks.length} {allTasks.length === 1 ? 'task' : 'tasks'} assigned to you
          </p>
        </div>
        <Button onClick={goToToday} variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Today
        </Button>
      </div>

      {/* Week Date Picker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPrevWeek}>
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'flex flex-col items-center py-2 px-1 rounded-lg transition-all',
                      'hover:bg-muted',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      isCurrentDay && !isSelected && 'bg-muted font-semibold'
                    )}
                  >
                    <span className="text-xs opacity-70">{format(day, 'EEE')}</span>
                    <span className="text-lg font-semibold">{format(day, 'd')}</span>
                  </button>
                );
              })}
            </div>

            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="text-center mt-3 text-sm font-medium text-muted-foreground">
            {format(selectedDate, 'MMMM d, yyyy')}
          </div>
        </CardContent>
      </Card>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All {allTasks.length > 0 && `(${allTasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="open">
            Open {openCount > 0 && `(${openCount})`}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Done {completedCount > 0 && `(${completedCount})`}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue {overdueCount > 0 && `(${overdueCount})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : sortedTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {statusFilter === 'all' ? (
              <>
                <CheckSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No tasks for {format(selectedDate, 'MMMM d')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {isToday(selectedDate) 
                    ? "You don't have any tasks assigned today. Enjoy your day or check with your foreman!"
                    : "No tasks assigned for this date. Select a different day to view your tasks."}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No {statusFilter} tasks
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try selecting a different filter to see your tasks.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <EmployeeTaskCard 
              key={task.id} 
              task={task}
              jobsiteName={task.jobsiteName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
