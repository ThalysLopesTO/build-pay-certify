
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format, addDays, subDays } from 'date-fns';

interface DailyHoursGridProps {
  control: Control<any>;
  disabled?: boolean;
  selectedWeek?: {
    startDate: Date;
    endDate: Date;
  } | null;
}

const DailyHoursGrid = ({ control, disabled = false, selectedWeek }: DailyHoursGridProps) => {
  const { settings } = useCompanySettings();
  
  // Get the week ending day from company settings (0=Sunday, 1=Monday, etc.)
  const weekEndingDay = settings?.week_ending_day ?? 0;
  const frequency = (settings as any)?.timesheet_frequency ?? 'weekly';

  // Calculate the week start day (6 days before the ending day)
  const weekStartDay = (weekEndingDay + 1) % 7;
  const totalDays = frequency === 'bi-weekly' ? 14 : 7;
  
  // Base day names and field names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fieldNames = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];
  
  // Create ordered days based on company's week start and frequency
  const orderedDays: { name: string; label: string; shortLabel: string; date: string; fullDate: Date | null }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const dayIndex = (weekStartDay + i) % 7;
    const dayDate = selectedWeek ? addDays(selectedWeek.startDate, i) : null;
    const baseName = fieldNames[dayIndex];
    const name = i < 7 ? baseName : `${baseName}Week2`;
    
    orderedDays.push({
      name,
      label: dayNames[dayIndex],
      shortLabel: dayNames[dayIndex].substring(0, 3),
      date: dayDate ? format(dayDate, 'EEE, MMM dd') : '',
      fullDate: dayDate || null,
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Daily Hours</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {orderedDays.map((day) => (
          <FormField
            key={day.name}
            control={control}
            name={day.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-center block">
                  <div className="font-semibold">{day.label}</div>
                  {day.date && (
                    <div className="text-xs text-gray-500 mt-1">{day.date}</div>
                  )}
                </FormLabel>
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
