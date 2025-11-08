import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Task } from '@/hooks/useJobsiteTasksAdvanced';
import { DraggableTaskItem } from './DraggableTaskItem';
import { useState, useEffect } from 'react';

interface DraggableTaskListProps {
  tasks: Task[];
  expandedTaskIds: Set<string>;
  selectedTaskIds: Set<string>;
  onToggle: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onMoveToTomorrow: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onSelect: (taskId: string) => void;
  onReorder: (updates: { taskId: string; sortOrder: number }[]) => void;
}

export function DraggableTaskList({
  tasks,
  expandedTaskIds,
  selectedTaskIds,
  onToggle,
  onEdit,
  onDuplicate,
  onMoveToTomorrow,
  onDelete,
  onSelect,
  onReorder,
}: DraggableTaskListProps) {
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  
  // Sync with prop changes
  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to activate drag
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
    const newIndex = orderedTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update UI
    const reordered = arrayMove(orderedTasks, oldIndex, newIndex);
    setOrderedTasks(reordered);

    // Generate updates for all affected tasks
    const updates = reordered.map((task, index) => ({
      taskId: task.id,
      sortOrder: index,
    }));

    // Call parent handler to persist changes
    onReorder(updates);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0">
          {orderedTasks.map((task) => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              isExpanded={expandedTaskIds.has(task.id)}
              isSelected={selectedTaskIds.has(task.id)}
              onToggle={() => onToggle(task.id)}
              onEdit={() => onEdit(task.id)}
              onDuplicate={() => onDuplicate(task.id)}
              onMoveToTomorrow={() => onMoveToTomorrow(task.id)}
              onDelete={() => onDelete(task.id)}
              onSelect={() => onSelect(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
