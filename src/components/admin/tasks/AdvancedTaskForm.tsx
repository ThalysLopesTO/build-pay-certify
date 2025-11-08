import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task, useTaskActions } from '@/hooks/useJobsiteTasksAdvanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TagSelector } from './TagSelector';
import { AssigneeSelector } from './AssigneeSelector';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const advancedTaskFormSchema = z.object({
  task_name: z.string().min(1, 'Task name is required'),
  task_date: z.string().min(1, 'Task date is required'),
  status: z.enum(['pending', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  trade: z.string().optional(),
  description: z.string().optional(),
  due_time: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof advancedTaskFormSchema>;

interface AdvancedTaskFormProps {
  jobsiteId: string;
  task?: Task;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function AdvancedTaskForm({ jobsiteId, task, onCancel, onSuccess }: AdvancedTaskFormProps) {
  const { createTask, updateTask } = useTaskActions();
  const isEditing = !!task;

  const form = useForm<FormValues>({
    resolver: zodResolver(advancedTaskFormSchema),
    defaultValues: {
      task_name: task?.title || '',
      task_date: task?.task_date || '',
      status: task?.status || 'pending',
      priority: task?.priority || 'medium',
      trade: task?.trade || '',
      description: task?.description || '',
      due_time: task?.due_time || '',
      assigneeIds: task?.assignees?.map(a => a.user_id) || [],
      tagIds: task?.tags?.map(t => t.id) || [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing) {
        await updateTask.mutateAsync({
          taskId: task.id,
          taskData: {
            title: data.task_name,
            task_date: data.task_date,
            status: data.status,
            priority: data.priority,
            trade: data.trade || undefined,
            description: data.description || undefined,
            due_time: data.due_time || undefined,
            assigneeIds: data.assigneeIds,
            tagIds: data.tagIds,
          },
        });
      } else {
        await createTask.mutateAsync({
          jobsiteId,
          taskData: {
            title: data.task_name,
            task_date: data.task_date,
            status: data.status,
            priority: data.priority,
            trade: data.trade || undefined,
            description: data.description || undefined,
            due_time: data.due_time || undefined,
            assigneeIds: data.assigneeIds,
            tagIds: data.tagIds,
          },
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting task:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
        
        {/* Task Name */}
        <div className="space-y-2">
          <Label htmlFor="task_name">Task Name *</Label>
          <Input
            id="task_name"
            {...form.register('task_name')}
            placeholder="Enter task name"
            className={form.formState.errors.task_name ? 'border-destructive' : ''}
          />
          {form.formState.errors.task_name && (
            <p className="text-sm text-destructive">{form.formState.errors.task_name.message}</p>
          )}
        </div>

        {/* Task Date */}
        <div className="space-y-2">
          <Label>Task Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch('task_date') && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch('task_date') 
                  ? format(new Date(form.watch('task_date')), 'PPP')
                  : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch('task_date') ? new Date(form.watch('task_date')) : undefined}
                onSelect={(date) => form.setValue('task_date', date ? format(date, 'yyyy-MM-dd') : '')}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.task_date && (
            <p className="text-sm text-destructive">{form.formState.errors.task_date.message}</p>
          )}
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status *</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority *</Label>
            <Select
              value={form.watch('priority')}
              onValueChange={(value) => form.setValue('priority', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trade */}
        <div className="space-y-2">
          <Label htmlFor="trade">Trade (Optional)</Label>
          <Input
            id="trade"
            {...form.register('trade')}
            placeholder="e.g., Electrical, Plumbing, Framing"
          />
        </div>
      </div>

      {/* Assignment Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-foreground">Assignment</h3>
        
        <AssigneeSelector
          selectedUserIds={form.watch('assigneeIds') || []}
          onChange={(userIds) => form.setValue('assigneeIds', userIds)}
        />
      </div>

      {/* Tags Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-foreground">Tags</h3>
        
        <TagSelector
          selectedTagIds={form.watch('tagIds') || []}
          onChange={(tagIds) => form.setValue('tagIds', tagIds)}
        />
      </div>

      {/* Notes Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-foreground">Additional Details</h3>
        
        <div className="space-y-2">
          <Label htmlFor="description">Notes (Optional)</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Add any additional notes or details about this task"
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.watch('description')?.length || 0} / 1000 characters
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={createTask.isPending || updateTask.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={createTask.isPending || updateTask.isPending}
        >
          {createTask.isPending || updateTask.isPending
            ? 'Saving...'
            : isEditing
            ? 'Update Task'
            : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
