
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface NotesFieldProps {
  control: Control<any>;
  disabled?: boolean;
}

const NotesField = ({ control, disabled = false }: NotesFieldProps) => {
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-orange-600" />
            <span>Notes (Optional)</span>
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Add any additional notes about your work this week..."
              disabled={disabled}
              className={`min-h-[100px] ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default NotesField;
