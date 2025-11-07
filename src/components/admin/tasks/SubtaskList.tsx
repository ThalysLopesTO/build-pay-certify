import { Subtask } from '@/hooks/useJobsiteTasksAdvanced';
import { SubtaskItem } from './SubtaskItem';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface SubtaskListProps {
  subtasks: Subtask[];
  isEditing: boolean;
  onUpdate: (subtasks: Subtask[]) => void;
  onToggleStatus?: (subtaskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
}

export function SubtaskList({ subtasks, isEditing, onUpdate, onToggleStatus }: SubtaskListProps) {
  const calculateProgress = () => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(st => st.status === 'completed').length;
    return (completed / subtasks.length) * 100;
  };

  const completedCount = subtasks.filter(st => st.status === 'completed').length;
  const totalCount = subtasks.length;

  if (subtasks.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No subtasks added yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Summary */}
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {completedCount} of {totalCount} completed
          </span>
        </div>
        <span className="text-muted-foreground font-medium">
          {Math.round(calculateProgress())}%
        </span>
      </div>
      
      <Progress value={calculateProgress()} className="h-2" />

      {/* Subtask Items */}
      <div className="space-y-2 mt-4">
        {subtasks
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              isEditing={isEditing}
              onToggleStatus={onToggleStatus}
            />
          ))}
      </div>
    </div>
  );
}
