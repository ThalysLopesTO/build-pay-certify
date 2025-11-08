import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import { Task } from '@/hooks/useJobsiteTasksAdvanced';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableTaskItemProps {
  task: Task;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onMoveToTomorrow: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

export function DraggableTaskItem({
  task,
  isExpanded,
  isSelected,
  onToggle,
  onEdit,
  onDuplicate,
  onMoveToTomorrow,
  onDelete,
  onSelect,
}: DraggableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 z-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center z-10',
          'opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
          'hover:bg-muted/50'
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Task Content - Add left padding for drag handle space */}
      <div className="pl-8">
        <TaskItem
          task={task}
          isExpanded={isExpanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onMoveToTomorrow={onMoveToTomorrow}
          onDelete={onDelete}
          isSelectable={true}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
