
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

interface ExpenseFieldProps {
  control: Control<any>;
  disabled?: boolean;
}

const ExpenseField = ({ control, disabled = false }: ExpenseFieldProps) => {
  return (
    <FormField
      control={control}
      name="additionalExpense"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <span>Additional Expenses</span>
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={disabled}
              className={disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              {...field}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ExpenseField;
