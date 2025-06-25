
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobsiteTask, JobsiteTaskInput, useJobsiteTaskActions } from '@/hooks/useJobsiteTasks';

const formSchema = z.object({
  task_name: z.string().min(1, 'Task name is required').min(2, 'Task name must be at least 2 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(['pending', 'in_progress', 'completed'] as const),
}).refine((data) => {
  return new Date(data.end_date) >= new Date(data.start_date);
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type FormData = z.infer<typeof formSchema>;

interface JobsiteTaskFormProps {
  jobsiteId: string;
  task?: JobsiteTask;
  onCancel: () => void;
  onSuccess?: () => void;
}

const JobsiteTaskForm: React.FC<JobsiteTaskFormProps> = ({ 
  jobsiteId, 
  task, 
  onCancel, 
  onSuccess 
}) => {
  const { addTask, updateTask } = useJobsiteTaskActions();
  const isEditing = !!task;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      task_name: task?.task_name || '',
      start_date: task?.start_date || '',
      end_date: task?.end_date || '',
      status: task?.status || 'pending',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Form data being submitted:', data);
      
      if (isEditing && task) {
        await updateTask.mutateAsync({
          taskId: task.id,
          taskData: data
        });
      } else {
        await addTask.mutateAsync({
          jobsiteId,
          taskData: data
        });
      }
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? 'Edit Task' : 'Add New Task'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="task_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter task name" 
                      {...field} 
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        placeholder="Select start date" 
                        {...field} 
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        placeholder="Select end date" 
                        {...field} 
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={addTask.isPending || updateTask.isPending}
              >
                {addTask.isPending || updateTask.isPending 
                  ? (isEditing ? 'Updating...' : 'Adding...')
                  : (isEditing ? 'Update Task' : 'Add Task')
                }
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  onCancel();
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default JobsiteTaskForm;
