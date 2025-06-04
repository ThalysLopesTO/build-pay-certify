
import React from 'react';
import { Control } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface NotesFieldProps {
  control: Control<any>;
}

const NotesField = ({ control }: NotesFieldProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <span>Work Description (Optional)</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the work performed during this week..."
                value={field.value || ''}
                onChange={field.onChange}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
            <p className="text-sm text-slate-500">
              Provide details about work performed, tasks completed, or any relevant information for this timesheet
            </p>
          </FormItem>
        )}
      />
    </div>
  );
};

export default NotesField;
