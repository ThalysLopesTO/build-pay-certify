/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTimesheetForm } from '@/hooks/useTimesheetForm';
import TimesheetHeader from './timesheet/TimesheetHeader';
import JobsiteSelector from './timesheet/JobsiteSelector';
import DailyHoursGrid from './timesheet/DailyHoursGrid';
import ExpenseField from './timesheet/ExpenseField';
import NotesField from './timesheet/NotesField';
import TimesheetSummary from './timesheet/TimesheetSummary';
import WeekSelector from './timesheet/WeekSelector';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format, addDays } from 'date-fns';

const TimesheetForm = () => {
  const [selectedWeek, setSelectedWeek] = useState<any>()
  const {
    form,
    totalHours,
    hourlyRate,
    grossPay,
    onSubmit,
    submitMutation,
    workWeeks,
    isWeekSubmitted,
    user,
  } = useTimesheetForm(selectedWeek);

  const isSubmitting = submitMutation.isPending;
  const { settings } = useCompanySettings();
  const isBiWeekly = (settings as any)?.timesheet_frequency === 'bi-weekly';

  const isSubmissionOpen = selectedWeek ? (selectedWeek as any).isSubmissionOpen ?? (new Date() >= addDays(selectedWeek.endDate, 1)) : false;
  const isFormDisabled = isWeekSubmitted || isSubmitting || !isSubmissionOpen;

  const headerTitle = isBiWeekly ? 'Bi-Weekly Timesheet' : 'Weekly Timesheet';
  const headerSubtitle = selectedWeek
    ? `${format(selectedWeek.startDate, 'MMM dd')} – ${format(addDays(selectedWeek.startDate, isBiWeekly ? 13 : 6), 'MMM dd')}`
    : undefined;

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
      <TimesheetHeader title={headerTitle} subtitle={headerSubtitle} />
      
      <CardContent className="p-6 space-y-6">
        {/* Week Selector */}
        <WeekSelector
          availableWeeks={workWeeks.availableWeeks}
          selectedWeek={selectedWeek}
          // submittedWeeks={existingTimesheets}
          onWeekSelect={setSelectedWeek}
        />

        {/* Selected Week Display */}
        {selectedWeek && (
          <Alert className={`${isWeekSubmitted ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
            <Calendar className={`h-4 w-4 ${isWeekSubmitted ? 'text-orange-600' : 'text-blue-600'}`} />
            <AlertDescription className={isWeekSubmitted ? 'text-orange-800' : 'text-blue-800'}>
              <strong>You're submitting hours for:</strong> {selectedWeek.rangeFormatted}
              {isWeekSubmitted && (
                <span className="ml-2 text-orange-700 flex items-center gap-1">
                  - Already submitted <CheckCircle className="h-4 w-4 text-green-600" />
                </span>
              )}
              {!isWeekSubmitted && !isSubmissionOpen && (
                <span className="ml-2 text-blue-700">
                  – In Progress. You can submit after {format(addDays(selectedWeek.endDate, 1), 'EEE, MMM dd')}.
                </span>
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
              disabled={isFormDisabled} 
              selectedWeek={selectedWeek}
            />

            <ExpenseField control={form.control} disabled={isFormDisabled} />

            <NotesField control={form.control} disabled={isFormDisabled} />

            <TimesheetSummary 
              totalHours={totalHours}
              hourlyRate={hourlyRate}
              grossPay={grossPay}
              form={form}
              disabled={isFormDisabled}
              workerType={user?.workerType}
            />

            <Button 
              type="submit" 
              className={`w-full text-lg py-3 transition-all duration-200 ${
                isFormDisabled
                  ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
              disabled={isFormDisabled || !selectedWeek}
            >
              {isWeekSubmitted 
                ? 'Already Submitted ✅' 
                : isSubmitting 
                  ? 'Submitting...' 
                  : !isSubmissionOpen
                    ? 'In Progress – Submit after period ends'
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
