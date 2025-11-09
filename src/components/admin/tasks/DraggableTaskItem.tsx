import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import { Task, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeableTaskItem } from './SwipeableTaskItem';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface DraggableTaskItemProps {
  task: Task;
  isExpanded: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
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
  isSelectionMode,
  onToggle,
  onEdit,
  onDuplicate,
  onMoveToTomorrow,
  onDelete,
  onSelect,
}: DraggableTaskItemProps) {
  const isMobile = useIsMobile();
  const { updateTask, bulkCompleteSubtasks } = useTaskActions();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: isMobile, // Disable drag-and-drop on mobile
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleComplete = async () => {
    if (task.status === 'done') return;
    
    const incompleteSubtasks = task.subtasks.filter(st => st.status !== 'done');
    
    if (incompleteSubtasks.length > 0) {
      setShowCompleteDialog(true);
    } else {
      await updateTask.mutateAsync({
        taskId: task.id,
        taskData: { status: 'done' },
      });
    }
  };

  const handleCompleteAll = async () => {
    await Promise.all([
      updateTask.mutateAsync({ taskId: task.id, taskData: { status: 'done' } }),
      bulkCompleteSubtasks.mutateAsync(task.id),
    ]);
    setShowCompleteDialog(false);
  };

  const handleCompleteTaskOnly = async () => {
    await updateTask.mutateAsync({
      taskId: task.id,
      taskData: { status: 'done' },
    });
    setShowCompleteDialog(false);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const taskContent = (
    <TaskItem
      task={task}
      isExpanded={isExpanded}
      onToggle={onToggle}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onMoveToTomorrow={onMoveToTomorrow}
      onDelete={onDelete}
      isSelectable={isSelectionMode}
      isSelected={isSelected}
      onSelect={onSelect}
    />
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative group',
          isDragging && 'opacity-50 z-50'
        )}
      >
        {/* Drag Handle - Hidden on mobile */}
        {!isMobile && (
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
        )}

        {/* Task Content - Conditionally wrapped with SwipeableTaskItem on mobile */}
        <div className={cn(!isMobile && 'pl-8')}>
          {isMobile ? (
            <SwipeableTaskItem
              onComplete={handleComplete}
              onDelete={() => setShowDeleteDialog(true)}
              taskStatus={task.status}
            >
              {taskContent}
            </SwipeableTaskItem>
          ) : (
            taskContent
          )}
        </div>
      </div>

      {/* Complete with Subtasks Dialog */}
      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Complete all subtasks?"
        description={`This task has ${task.subtasks.filter(st => st.status !== 'done').length} incomplete subtask(s). Would you like to complete them all?`}
        confirmText="Complete All"
        cancelText="Task Only"
        onConfirm={handleCompleteAll}
        onCancel={handleCompleteTaskOnly}
        variant="default"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete this task?"
        description="This action cannot be undone. The task and all its subtasks will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
