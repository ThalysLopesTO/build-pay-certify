import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTaskActions, useJobsiteTasksAdvanced } from '@/hooks/useJobsiteTasksAdvanced';
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
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { formatInCompanyTimezone, DEFAULT_TIMEZONE } from '@/utils/timezone';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  task_date: z.string().min(1, 'Task date is required'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  trade: z.string().optional(),
  description: z.string().optional(),
  due_time: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof taskFormSchema>;

interface DailyTaskFormProps {
  jobsiteId: string;
  taskId?: string;
  defaultDate?: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function DailyTaskForm({ jobsiteId, taskId, defaultDate, onCancel, onSuccess }: DailyTaskFormProps) {
  const { createTask, updateTask } = useTaskActions();
  const { data: tasks = [] } = useJobsiteTasksAdvanced(jobsiteId, {});
  const { settings } = useCompanySettings();
  const task = tasks.find((t) => t.id === taskId);
  const isEditing = !!task;

  const companyTimezone = settings?.timezone || DEFAULT_TIMEZONE;

  const form = useForm<FormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      task_date: task?.task_date || defaultDate || formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone),
      priority: task?.priority || undefined,
      trade: task?.trade || '',
      description: task?.description || '',
      due_time: task?.due_time || '',
      assigneeIds: task?.assignees?.map((a) => a.user_id) || [],
      tagIds: task?.tags?.map((t) => t.id) || [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing && taskId) {
        await updateTask.mutateAsync({
          taskId,
          taskData: {
            title: data.title,
            task_date: data.task_date,
            status: 'pending',
            priority: data.priority || 'medium',
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
            title: data.title,
            task_date: data.task_date,
            status: 'pending',
            priority: data.priority || 'medium',
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
      {/* Task Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="e.g., Install drywall in unit 3A"
          className={cn('h-11', form.formState.errors.title && 'border-destructive')}
          autoFocus
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
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
                'w-full justify-start text-left font-normal h-11',
                !form.watch('task_date') && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.watch('task_date') ? format(new Date(form.watch('task_date') + 'T12:00:00'), 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.watch('task_date') ? new Date(form.watch('task_date') + 'T12:00:00') : undefined}
              onSelect={(date) => form.setValue('task_date', date ? format(date, 'yyyy-MM-dd') : '')}
              disabled={(date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const todayInCompanyTZ = formatInCompanyTimezone(new Date(), 'yyyy-MM-dd', companyTimezone);
                return dateStr < todayInCompanyTZ;
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.task_date && (
          <p className="text-sm text-destructive">{form.formState.errors.task_date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Add details, notes, or instructions..."
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label>Priority (optional)</Label>
        <Select value={form.watch('priority') || ''} onValueChange={(value) => form.setValue('priority', value as any)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select priority (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trade & Due Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trade">Trade (Optional)</Label>
          <Input
            id="trade"
            {...form.register('trade')}
            placeholder="e.g., Framing, Electrical"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_time">Due Time (Optional)</Label>
          <Input id="due_time" type="time" {...form.register('due_time')} className="h-11" />
        </div>
      </div>

      {/* Assignees */}
      <div className="space-y-2">
        <AssigneeSelector
          selectedUserIds={form.watch('assigneeIds') || []}
          onChange={(userIds) => form.setValue('assigneeIds', userIds)}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <TagSelector selectedTagIds={form.watch('tagIds') || []} onChange={(tagIds) => form.setValue('tagIds', tagIds)} />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 h-11" disabled={createTask.isPending || updateTask.isPending}>
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
