
import React from 'react';
import { Control } from 'react-hook-form';
import { DollarSign } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ExpenseFieldProps {
  control: Control<any>;
}

const ExpenseField = ({ control }: ExpenseFieldProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="additionalExpense"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span>Additional Expense (Optional)</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={field.value?.toString() || ''}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                className="text-center"
              />
            </FormControl>
            <FormMessage />
            <p className="text-sm text-slate-500">
              Enter any additional expenses for reimbursement (e.g., materials, travel)
            </p>
          </FormItem>
        )}
      />
    </div>
  );
};

export default ExpenseField;
