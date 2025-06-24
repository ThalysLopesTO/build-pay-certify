
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useTimesheetForm } from '@/hooks/useTimesheetForm';
import TimesheetHeader from './timesheet/TimesheetHeader';
import JobsiteSelector from './timesheet/JobsiteSelector';
import DailyHoursGrid from './timesheet/DailyHoursGrid';
import ExpenseField from './timesheet/ExpenseField';
import NotesField from './timesheet/NotesField';
import TimesheetSummary from './timesheet/TimesheetSummary';
import WeekSelector from './timesheet/WeekSelector';

const TimesheetForm = () => {
  const {
    form,
    totalHours,
    hourlyRate,
    grossPay,
    onSubmit,
    submitMutation,
    workWeeks,
    selectedWeek,
    setSelectedWeek,
    existingTimesheets,
    isWeekSubmitted,
  } = useTimesheetForm();

  if (!workWeeks) {
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
      
      <CardContent className="p-6 space-y-6">
        {/* Week Selector */}
        <WeekSelector
          availableWeeks={workWeeks.availableWeeks}
          selectedWeek={selectedWeek}
          submittedWeeks={existingTimesheets}
          onWeekSelect={setSelectedWeek}
        />

        {/* Selected Week Display */}
        {selectedWeek && (
          <Alert className={`${isWeekSubmitted ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
            <Calendar className={`h-4 w-4 ${isWeekSubmitted ? 'text-orange-600' : 'text-blue-600'}`} />
            <AlertDescription className={isWeekSubmitted ? 'text-orange-800' : 'text-blue-800'}>
              <strong>You're submitting hours for:</strong> {selectedWeek.rangeFormatted}
              {isWeekSubmitted && (
                <span className="ml-2 text-orange-700">- Already submitted</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Duplicate Submission Warning */}
        {isWeekSubmitted && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>You've already submitted hours for this week.</strong> 
              The form has been disabled to prevent duplicate submissions.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <JobsiteSelector control={form.control} />

            <DailyHoursGrid 
              control={form.control} 
              disabled={isWeekSubmitted} 
              selectedWeek={selectedWeek}
            />

            <ExpenseField control={form.control} disabled={isWeekSubmitted} />

            <NotesField control={form.control} disabled={isWeekSubmitted} />

            <TimesheetSummary 
              totalHours={totalHours}
              hourlyRate={hourlyRate}
              grossPay={grossPay}
            />

            <Button 
              type="submit" 
              className={`w-full text-lg py-3 ${
                isWeekSubmitted 
                  ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
              disabled={submitMutation.isPending || isWeekSubmitted || !selectedWeek}
            >
              {isWeekSubmitted 
                ? 'Already Submitted' 
                : submitMutation.isPending 
                  ? 'Submitting...' 
                  : 'Submit Timesheet'
              }
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TimesheetForm;
