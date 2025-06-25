
import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobsiteTaskFormData } from './jobsiteTaskFormSchema';

interface JobsiteTaskFormFieldsProps {
  control: Control<JobsiteTaskFormData>;
}

const JobsiteTaskFormFields: React.FC<JobsiteTaskFormFieldsProps> = ({ control }) => {
  return (
    <>
      <FormField
        control={control}
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
          control={control}
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
          control={control}
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
        control={control}
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
    </>
  );
};

export default JobsiteTaskFormFields;
