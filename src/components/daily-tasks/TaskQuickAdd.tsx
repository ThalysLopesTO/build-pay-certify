import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface TaskQuickAddProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export const TaskQuickAdd: React.FC<TaskQuickAddProps> = ({ onAdd, disabled }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        disabled={disabled}
        className="flex-1 h-9 text-sm"
      />
    </form>
  );
};
