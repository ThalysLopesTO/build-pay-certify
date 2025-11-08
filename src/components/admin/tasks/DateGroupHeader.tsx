import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Task } from '@/hooks/useJobsiteTasksAdvanced';
import { DailyTaskCard } from './DailyTaskCard';
import { cn } from '@/lib/utils';

interface DateGroupHeaderProps {
  date: string;
  tasks: Task[];
  onTaskEdit: (taskId: string) => void;
}

export function DateGroupHeader({ date, tasks, onTaskEdit }: DateGroupHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'no-date') return 'No Date Assigned';
    try {
      const d = new Date(dateStr);
      return format(d, 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <Calendar className="w-5 h-5 text-primary" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  {formatDateHeader(date)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {completedCount} of {totalCount} completed
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-2">
              {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
            </Badge>
          </Button>
        </CollapsibleTrigger>

        {/* Task List */}
        <CollapsibleContent>
          <div className="border-t">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No tasks for this date
              </div>
            ) : (
              <div className="divide-y">
                {tasks.map((task) => (
                  <DailyTaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => onTaskEdit(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
