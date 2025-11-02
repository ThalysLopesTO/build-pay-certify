import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TaskPrioritySelector } from './TaskPrioritySelector';
import { TaskAssigneeMultiSelect } from './TaskAssigneeMultiSelect';
import { TaskCustomTagInput } from './TaskCustomTagInput';
import { TaskPriority } from '@/types/daily-tasks';
import { useCompanyTaskTags } from '@/hooks/daily-tasks/useCompanyTaskTags';
import { Loader2 } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    priority: TaskPriority;
    notes?: string;
    assignee_ids: string[];
    tags: string[];
  }) => void;
  isLoading?: boolean;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [notes, setNotes] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const { data: tagSuggestions = [] } = useCompanyTaskTags();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      priority,
      notes: notes.trim() || undefined,
      assignee_ids: assigneeIds,
      tags,
    });

    // Reset form
    setTitle('');
    setPriority('medium');
    setNotes('');
    setAssigneeIds([]);
    setTags([]);
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle('');
      setPriority('medium');
      setNotes('');
      setAssigneeIds([]);
      setTags([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              disabled={isLoading}
              required
            />
          </div>

          <TaskPrioritySelector
            value={priority}
            onChange={setPriority}
            disabled={isLoading}
          />

          <TaskAssigneeMultiSelect
            selectedUserIds={assigneeIds}
            onChange={setAssigneeIds}
            disabled={isLoading}
          />

          <TaskCustomTagInput
            tags={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
