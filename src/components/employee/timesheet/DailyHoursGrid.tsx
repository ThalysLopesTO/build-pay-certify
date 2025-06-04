
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface DailyHoursGridProps {
  control: Control<any>;
}

const DailyHoursGrid = ({ control }: DailyHoursGridProps) => {
  const daysOfWeek = [
    { key: 'mondayHours', label: 'Monday' },
    { key: 'tuesdayHours', label: 'Tuesday' },
    { key: 'wednesdayHours', label: 'Wednesday' },
    { key: 'thursdayHours', label: 'Thursday' },
    { key: 'fridayHours', label: 'Friday' },
    { key: 'saturdayHours', label: 'Saturday' },
    { key: 'sundayHours', label: 'Sunday' }
  ];

  return (
    <div className="space-y-4">
      <FormLabel className="text-lg font-semibold">Daily Hours</FormLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {daysOfWeek.map((day) => (
          <FormField
            key={day.key}
            control={control}
            name={day.key}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{day.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="0"
                    value={field.value?.toString() || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="text-center"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default DailyHoursGrid;
