
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Clock, DollarSign } from 'lucide-react';
import JobsiteSelect from './JobsiteSelect';
import DatePickerField from './DatePickerField';
import { useTimesheetSubmission } from '@/hooks/useTimesheetSubmission';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  weekStartDate: z.date({
    required_error: 'Please select the week start date',
  }),
  mondayHours: z.number().min(0).max(24),
  tuesdayHours: z.number().min(0).max(24),
  wednesdayHours: z.number().min(0).max(24),
  thursdayHours: z.number().min(0).max(24),
  fridayHours: z.number().min(0).max(24),
  saturdayHours: z.number().min(0).max(24),
  sundayHours: z.number().min(0).max(24),
});

type FormData = z.infer<typeof formSchema>;

const ForemanTimesheetForm = () => {
  const { user } = useAuth();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsiteId: '',
      mondayHours: 0,
      tuesdayHours: 0,
      wednesdayHours: 0,
      thursdayHours: 0,
      fridayHours: 0,
      saturdayHours: 0,
      sundayHours: 0,
    },
  });

  const submitMutation = useTimesheetSubmission();

  const watchedValues = form.watch();
  const totalHours = (
    watchedValues.mondayHours + watchedValues.tuesdayHours + 
    watchedValues.wednesdayHours + watchedValues.thursdayHours + 
    watchedValues.fridayHours + watchedValues.saturdayHours + 
    watchedValues.sundayHours
  );

  const hourlyRate = parseFloat(user?.user_metadata?.hourly_rate || '0');
  const grossPay = totalHours * hourlyRate;

  const onSubmit = (data: FormData) => {
    const weekStart = startOfWeek(data.weekStartDate, { weekStartsOn: 1 });
    
    const timesheetData = {
      jobsiteId: data.jobsiteId,
      weekStartDate: format(weekStart, 'yyyy-MM-dd'),
      mondayHours: data.mondayHours,
      tuesdayHours: data.tuesdayHours,
      wednesdayHours: data.wednesdayHours,
      thursdayHours: data.thursdayHours,
      fridayHours: data.fridayHours,
      saturdayHours: data.saturdayHours,
      sundayHours: data.sundayHours,
      hourlyRate: hourlyRate,
    };
    
    submitMutation.mutate(timesheetData);
    form.reset();
  };

  const daysOfWeek = [
    { key: 'mondayHours', label: 'Monday' },
    { key: 'tuesdayHours', label: 'Tuesday' },
    { key: 'wednesdayHours', label: 'Wednesday' },
    { key: 'thursdayHours', label: 'Thursday' },
    { key: 'fridayHours', label: 'Friday' },
    { key: 'saturdayHours', label: 'Saturday' },
    { key: 'sundayHours', label: 'Sunday' },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Submit Weekly Timesheet</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobsiteId"
                render={({ field }) => (
                  <JobsiteSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="weekStartDate"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    label="Week Start Date (Monday)"
                    placeholder="Select week start date"
                  />
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Hours</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day.key}
                    control={form.control}
                    name={day.key as keyof FormData}
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
                            {...field}
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

            <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Hourly Rate</p>
                <p className="text-2xl font-bold text-green-600">${hourlyRate.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Gross Pay</p>
                <p className="text-2xl font-bold text-orange-600">${grossPay.toFixed(2)}</p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Weekly Timesheet'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ForemanTimesheetForm;
