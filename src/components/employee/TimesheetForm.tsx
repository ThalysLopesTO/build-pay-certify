
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from 'lucide-react';
import { useTimesheetForm } from '@/hooks/useTimesheetForm';
import TimesheetHeader from './timesheet/TimesheetHeader';
import JobsiteSelector from './timesheet/JobsiteSelector';
import DailyHoursGrid from './timesheet/DailyHoursGrid';
import ExpenseField from './timesheet/ExpenseField';
import NotesField from './timesheet/NotesField';
import TimesheetSummary from './timesheet/TimesheetSummary';

const TimesheetForm = () => {
  const {
    form,
    totalHours,
    hourlyRate,
    grossPay,
    onSubmit,
    submitMutation,
    workWeek,
  } = useTimesheetForm();

  if (!workWeek) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Loading work week configuration. Please wait or contact your administrator if this persists.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <TimesheetHeader />
      
      <CardContent className="p-6">
        {/* Work Week Display */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>You're submitting hours for:</strong> {workWeek.rangeFormatted}
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <JobsiteSelector control={form.control} />

            <DailyHoursGrid control={form.control} />

            <ExpenseField control={form.control} />

            <NotesField control={form.control} />

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
