import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTaskMutations } from '@/hooks/daily-tasks/useTaskMutations';
import { Plus, X } from 'lucide-react';

interface TaskQuickAddProps {
  listId: string;
  parentItemId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TaskQuickAdd = ({ listId, parentItemId, onSuccess, onCancel }: TaskQuickAddProps) => {
  const [title, setTitle] = useState('');
  const { createTask } = useTaskMutations();

  const handleAdd = async () => {
    if (!title.trim()) return;

    await createTask.mutateAsync({
      list_id: listId,
      title: title.trim(),
      parent_item_id: parentItemId,
    });

    setTitle('');
    onSuccess?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Enter task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button onClick={handleAdd} size="icon" disabled={!title.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
      {onCancel && (
        <Button onClick={onCancel} size="icon" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
