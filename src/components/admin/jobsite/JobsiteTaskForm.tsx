
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { JobsiteTask, JobsiteTaskInput, JobsiteTaskUpdateInput, useJobsiteTaskActions } from '@/hooks/useJobsiteTasks';
import { jobsiteTaskFormSchema, JobsiteTaskFormData } from './form/jobsiteTaskFormSchema';
import JobsiteTaskFormFields from './form/JobsiteTaskFormFields';
import JobsiteTaskFormActions from './form/JobsiteTaskFormActions';

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
  
  const form = useForm<JobsiteTaskFormData>({
    resolver: zodResolver(jobsiteTaskFormSchema),
    defaultValues: {
      task_name: task?.task_name || '',
      start_date: task?.start_date || '',
      end_date: task?.end_date || '',
      status: task?.status || 'pending',
    },
  });

  const onSubmit = async (data: JobsiteTaskFormData) => {
    try {
      console.log('Form data being submitted:', data);
      
      if (isEditing && task) {
        const updateData: JobsiteTaskUpdateInput = {
          task_name: data.task_name,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status,
        };
        
        await updateTask.mutateAsync({
          taskId: task.id,
          taskData: updateData
        });
      } else {
        const createData: JobsiteTaskInput = {
          task_name: data.task_name,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status,
        };
        
        await addTask.mutateAsync({
          jobsiteId,
          taskData: createData
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
            <JobsiteTaskFormFields control={form.control} />

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            <JobsiteTaskFormActions
              isEditing={isEditing}
              isLoading={addTask.isPending || updateTask.isPending}
              onCancel={onCancel}
              onReset={form.reset}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default JobsiteTaskForm;
