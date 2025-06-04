
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useTimesheetForm } from '@/hooks/useTimesheetForm';
import TimesheetHeader from './timesheet/TimesheetHeader';
import JobsiteWeekSelector from './timesheet/JobsiteWeekSelector';
import DailyHoursGrid from './timesheet/DailyHoursGrid';
import ExpenseField from './timesheet/ExpenseField';
import TimesheetSummary from './timesheet/TimesheetSummary';

const TimesheetForm = () => {
  const {
    form,
    totalHours,
    hourlyRate,
    grossPay,
    onSubmit,
    submitMutation,
    weekEndingDates,
  } = useTimesheetForm();

  return (
    <Card className="max-w-4xl mx-auto">
      <TimesheetHeader />
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <JobsiteWeekSelector 
              control={form.control} 
              weekEndingDates={weekEndingDates} 
            />

            <DailyHoursGrid control={form.control} />

            <ExpenseField control={form.control} />

            <TimesheetSummary 
              totalHours={totalHours}
              hourlyRate={hourlyRate}
              grossPay={grossPay}
            />

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TimesheetForm;
