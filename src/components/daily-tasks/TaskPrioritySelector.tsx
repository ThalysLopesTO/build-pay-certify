import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TaskPriority } from '@/types/daily-tasks';
import { TaskPriorityBadge } from './TaskPriorityBadge';

interface TaskPrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

export const TaskPrioritySelector: React.FC<TaskPrioritySelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="space-y-2">
      <Label>Priority</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as TaskPriority)}
        disabled={disabled}
        className="flex flex-wrap gap-2"
      >
        {priorities.map((priority) => (
          <div key={priority} className="flex items-center">
            <RadioGroupItem
              value={priority}
              id={`priority-${priority}`}
              className="sr-only peer"
            />
            <Label
              htmlFor={`priority-${priority}`}
              className="cursor-pointer peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary rounded-full"
            >
              <TaskPriorityBadge priority={priority} size="md" />
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
