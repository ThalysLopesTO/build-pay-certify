import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { DraftSubtask } from './types';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SubtaskComposerProps {
  subtasks: DraftSubtask[];
  onSubtasksChange: (subtasks: DraftSubtask[]) => void;
  onDone: () => void;
  onCancel: () => void;
}

export function SubtaskComposer({
  subtasks,
  onSubtasksChange,
  onDone,
  onCancel,
}: SubtaskComposerProps) {
  const handleAddSubtask = () => {
    const newSubtask: DraftSubtask = {
      id: uuidv4(),
      title: '',
    };
    onSubtasksChange([...subtasks, newSubtask]);
  };

  const handleRemoveSubtask = (id: string) => {
    onSubtasksChange(subtasks.filter(st => st.id !== id));
  };

  const handleUpdateSubtaskTitle = (id: string, title: string) => {
    onSubtasksChange(
      subtasks.map(st => (st.id === id ? { ...st, title } : st))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = subtasks.findIndex(st => st.id === id);
      if (currentIndex === subtasks.length - 1) {
        handleAddSubtask();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Subtasks</h3>
        <p className="text-xs text-muted-foreground">
          Break down this task into smaller steps
        </p>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {subtasks.map((subtask, index) => (
            <motion.div
              key={subtask.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex items-center gap-2 group"
            >
              <div className="flex items-center gap-2 flex-1 p-3 rounded-lg border bg-background">
                <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                <input
                  type="text"
                  value={subtask.title}
                  onChange={(e) => handleUpdateSubtaskTitle(subtask.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, subtask.id)}
                  placeholder="Subtask description"
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none",
                    "text-sm text-foreground placeholder:text-muted-foreground"
                  )}
                  autoFocus={index === subtasks.length - 1}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSubtask(subtask.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSubtask}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subtask
        </Button>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={onDone} className="flex-1">
          Done
        </Button>
      </div>
    </div>
  );
}
