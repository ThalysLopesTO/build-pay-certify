import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DraftTask } from './types';
import { format } from 'date-fns';
import { CheckCircle2, Loader2, Calendar, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TaskReviewSummaryProps {
  jobsiteName: string;
  draftTasks: DraftTask[];
  isCreating: boolean;
  onBack: () => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function TaskReviewSummary({
  jobsiteName,
  draftTasks,
  isCreating,
  onBack,
  onCreate,
  onCancel,
}: TaskReviewSummaryProps) {
  const totalSubtasks = draftTasks.reduce((acc, task) => acc + (task.subtasks?.length || 0), 0);
  const uniqueDates = [...new Set(draftTasks.map(t => t.date))];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <h2 className="text-lg font-semibold">Ready to Create</h2>
        <p className="text-sm text-muted-foreground">Review your tasks before creating</p>
      </div>

      {/* Summary Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Overview */}
        <div className="space-y-2 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Jobsite:</span>
            <span>{jobsiteName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Date{uniqueDates.length > 1 ? 's' : ''}:</span>
            <span>
              {uniqueDates.map(date => format(new Date(date), 'MMM d, yyyy')).join(', ')}
            </span>
          </div>
        </div>

        {/* Task Count */}
        <div className="flex items-center gap-2 text-foreground">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="text-base font-semibold">
            {draftTasks.length} Task{draftTasks.length > 1 ? 's' : ''}
            {totalSubtasks > 0 && ` with ${totalSubtasks} subtask${totalSubtasks > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {draftTasks.map((task, index) => (
            <div
              key={task.id}
              className={cn(
                "p-3 rounded-lg border bg-background space-y-2",
                "transition-colors hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  {/* Task Metadata */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task.priority && (
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                    )}
                    {task.trade && (
                      <Badge variant="outline" className="text-xs">
                        {task.trade}
                      </Badge>
                    )}
                    {task.dueTime && (
                      <Badge variant="outline" className="text-xs">
                        Due: {task.dueTime}
                      </Badge>
                    )}
                    {task.assigneeIds && task.assigneeIds.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {task.assigneeIds.length} assignee{task.assigneeIds.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2 pl-4 space-y-1">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-3 h-3 rounded border border-border flex-shrink-0" />
                          <span className="line-clamp-1">{subtask.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 border-t border-border p-4 space-y-2">
        <Button
          onClick={onCreate}
          disabled={isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Create All Tasks
            </>
          )}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isCreating}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isCreating}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
