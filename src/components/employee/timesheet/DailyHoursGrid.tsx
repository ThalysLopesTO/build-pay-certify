
import React from 'react';
import { Control, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format, addDays } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

  // Split into weeks and compute totals
  const week1Days = orderedDays.slice(0, Math.min(7, orderedDays.length));
  const week2Days = orderedDays.slice(7, 14);

  const values = useWatch({ control }) as Record<string, number> | undefined;
  const sumHours = (names: string[]) => names.reduce((acc, n) => acc + Number(values?.[n] ?? 0), 0);
  const week1Total = sumHours(week1Days.map((d) => d.name));
  const week2Total = sumHours(week2Days.map((d) => d.name));
  const grandTotal = week1Total + week2Total;

  const [open, setOpen] = React.useState<string | undefined>(() => {
    if (typeof window === 'undefined') return 'week1';
    return localStorage.getItem('ts_lastOpenWeek') || 'week1';
  });
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ts_lastOpenWeek', open ?? '');
    }
  }, [open]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Daily Hours</h3>
      {frequency === 'bi-weekly' ? (
        <div className="space-y-3">
          <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
            <AccordionItem value="week1">
              <AccordionTrigger>Week 1</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                  {week1Days.map((day) => (
                    <FormField
                      key={day.name}
                      control={control}
                      name={day.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-center block">
                            <div className="font-semibold text-foreground">{day.label}</div>
                            {day.date && (
                              <div className="text-xs text-muted-foreground mt-1">{day.date}</div>
                            )}
                          </FormLabel>
                           <FormControl>
                             <Input
                               type="number"
                               inputMode="decimal"
                               min="0"
                               max="24"
                               step="0.25"
                               disabled={disabled}
                               className={disabled ? 'opacity-60 cursor-not-allowed' : ''}
                               {...field}
                               value={field.value === 0 ? '' : field.value}
                               onClick={(e) => e.stopPropagation()}
                               onFocus={(e) => {
                                 e.stopPropagation();
                                 e.target.select();
                               }}
                               onKeyDown={(e) => e.stopPropagation()}
                               onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                             />
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <div className="mt-2 text-right text-sm text-muted-foreground">Week 1 Total: <span className="font-semibold text-foreground">{week1Total.toFixed(2)}h</span></div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="week2">
              <AccordionTrigger>Week 2</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                  {week2Days.map((day) => (
                    <FormField
                      key={day.name}
                      control={control}
                      name={day.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-center block">
                            <div className="font-semibold text-foreground">{day.label}</div>
                            {day.date && (
                              <div className="text-xs text-muted-foreground mt-1">{day.date}</div>
                            )}
                          </FormLabel>
                           <FormControl>
                             <Input
                               type="number"
                               inputMode="decimal"
                               min="0"
                               max="24"
                               step="0.25"
                               disabled={disabled}
                               className={disabled ? 'opacity-60 cursor-not-allowed' : ''}
                               {...field}
                               value={field.value === 0 ? '' : field.value}
                               onClick={(e) => e.stopPropagation()}
                               onFocus={(e) => {
                                 e.stopPropagation();
                                 e.target.select();
                               }}
                               onKeyDown={(e) => e.stopPropagation()}
                               onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                             />
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <div className="mt-2 text-right text-sm text-muted-foreground">Week 2 Total: <span className="font-semibold text-foreground">{week2Total.toFixed(2)}h</span></div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="text-right text-sm text-foreground">Grand Total: <span className="font-bold">{grandTotal.toFixed(2)}h</span></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          {orderedDays.map((day) => (
            <FormField
              key={day.name}
              control={control}
              name={day.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-center block">
                    <div className="font-semibold text-foreground">{day.label}</div>
                    {day.date && (
                      <div className="text-xs text-muted-foreground mt-1">{day.date}</div>
                    )}
                  </FormLabel>
                   <FormControl>
                     <Input
                       type="number"
                       inputMode="decimal"
                       min="0"
                       max="24"
                       step="0.25"
                       disabled={disabled}
                       className={disabled ? 'opacity-60 cursor-not-allowed' : ''}
                       {...field}
                       value={field.value === 0 ? '' : field.value}
                       onFocus={(e) => e.target.select()}
                       onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                     />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyHoursGrid;
