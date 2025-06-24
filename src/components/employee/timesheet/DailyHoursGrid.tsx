
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface DailyHoursGridProps {
  control: Control<any>;
  disabled?: boolean;
}

const DailyHoursGrid = ({ control, disabled = false }: DailyHoursGridProps) => {
  const days = [
    { name: 'mondayHours', label: 'Monday' },
    { name: 'tuesdayHours', label: 'Tuesday' },
    { name: 'wednesdayHours', label: 'Wednesday' },
    { name: 'thursdayHours', label: 'Thursday' },
    { name: 'fridayHours', label: 'Friday' },
    { name: 'saturdayHours', label: 'Saturday' },
    { name: 'sundayHours', label: 'Sunday' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Daily Hours</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {days.map((day) => (
          <FormField
            key={day.name}
            control={control}
            name={day.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{day.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
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
        ))}
      </div>
    </div>
  );
};

export default DailyHoursGrid;
