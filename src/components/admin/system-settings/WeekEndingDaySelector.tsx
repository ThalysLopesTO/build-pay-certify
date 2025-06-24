
import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

const WEEK_ENDING_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface WeekEndingDaySelectorProps {
  control: Control<any>;
}

export const WeekEndingDaySelector: React.FC<WeekEndingDaySelectorProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="week_ending_day"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Week Ending Day</span>
          </FormLabel>
          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select week ending day" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {WEEK_ENDING_DAYS.map((day) => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
