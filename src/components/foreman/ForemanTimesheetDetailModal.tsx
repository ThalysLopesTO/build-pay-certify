import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTimesheetSubmission } from '@/hooks/useTimesheetSubmission';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { isSubmissionOpen } from '@/lib/time/periods';
import { format, addDays } from 'date-fns';
import JobsiteSelector from '../employee/timesheet/JobsiteSelector';
import DailyHoursGrid from '../employee/timesheet/DailyHoursGrid';
import ExpenseField from '../employee/timesheet/ExpenseField';
import NotesField from '../employee/timesheet/NotesField';
import TimesheetSummary from '../employee/timesheet/TimesheetSummary';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  mondayHours: z.coerce.number().min(0).max(24),
  tuesdayHours: z.coerce.number().min(0).max(24),
  wednesdayHours: z.coerce.number().min(0).max(24),
  thursdayHours: z.coerce.number().min(0).max(24),
  fridayHours: z.coerce.number().min(0).max(24),
  saturdayHours: z.coerce.number().min(0).max(24),
  sundayHours: z.coerce.number().min(0).max(24),
  // Week 2 fields for bi-weekly timesheets
  mondayHoursWeek2: z.coerce.number().min(0).max(24).optional(),
  tuesdayHoursWeek2: z.coerce.number().min(0).max(24).optional(),
  wednesdayHoursWeek2: z.coerce.number().min(0).max(24).optional(),
  thursdayHoursWeek2: z.coerce.number().min(0).max(24).optional(),
  fridayHoursWeek2: z.coerce.number().min(0).max(24).optional(),
  saturdayHoursWeek2: z.coerce.number().min(0).max(24).optional(),
  sundayHoursWeek2: z.coerce.number().min(0).max(24).optional(),
  additionalExpense: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ForemanTimesheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeek: any;
  existingTimesheets: string[];
}

const ForemanTimesheetDetailModal = ({ 
  isOpen, 
  onClose, 
  selectedWeek, 
  existingTimesheets 
}: ForemanTimesheetDetailModalProps) => {
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const submitMutation = useTimesheetSubmission();

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
      // Week 2 defaults for bi-weekly timesheets
      mondayHoursWeek2: 0,
      tuesdayHoursWeek2: 0,
      wednesdayHoursWeek2: 0,
      thursdayHoursWeek2: 0,
      fridayHoursWeek2: 0,
      saturdayHoursWeek2: 0,
      sundayHoursWeek2: 0,
      additionalExpense: 0,
      notes: '',
    },
  });

  const watchedValues = form.watch();
  const isBiWeekly = (settings as any)?.timesheet_frequency === 'bi-weekly';
  
  // Calculate total hours including Week 2 for bi-weekly timesheets
  const week1Hours = (
    watchedValues.mondayHours + watchedValues.tuesdayHours + 
    watchedValues.wednesdayHours + watchedValues.thursdayHours + 
    watchedValues.fridayHours + watchedValues.saturdayHours + 
    watchedValues.sundayHours
  );
  
  const week2Hours = isBiWeekly ? (
    (watchedValues.mondayHoursWeek2 || 0) + (watchedValues.tuesdayHoursWeek2 || 0) + 
    (watchedValues.wednesdayHoursWeek2 || 0) + (watchedValues.thursdayHoursWeek2 || 0) + 
    (watchedValues.fridayHoursWeek2 || 0) + (watchedValues.saturdayHoursWeek2 || 0) + 
    (watchedValues.sundayHoursWeek2 || 0)
  ) : 0;
  
  const totalHours = week1Hours + week2Hours;

  const hourlyRate = parseFloat(user?.user_metadata?.hourly_rate || '25');
  const grossPay = (totalHours * hourlyRate) + (watchedValues.additionalExpense || 0);

  const isWeekSubmitted = selectedWeek ? existingTimesheets.includes(selectedWeek.weekStartDateString) : false;
  const isSubmitting = submitMutation.isPending;
  
  // Check if submission is open (same logic as employee timesheets)
  const isSubmissionOpenForWeek = selectedWeek ? (selectedWeek as any).isSubmissionOpen ?? isSubmissionOpen(selectedWeek.endDate) : false;
  const isFormDisabled = isWeekSubmitted || isSubmitting || !isSubmissionOpenForWeek;

  const onSubmit = (data: FormData) => {
    if (!selectedWeek) return;

    const timesheetData = {
      jobsiteId: data.jobsiteId,
      weekStartDate: selectedWeek.weekStartDateString,
      mondayHours: data.mondayHours,
      tuesdayHours: data.tuesdayHours,
      wednesdayHours: data.wednesdayHours,
      thursdayHours: data.thursdayHours,
      fridayHours: data.fridayHours,
      saturdayHours: data.saturdayHours,
      sundayHours: data.sundayHours,
      // Include Week 2 fields for bi-weekly timesheets
      ...(isBiWeekly && {
        mondayHoursWeek2: data.mondayHoursWeek2 || 0,
        tuesdayHoursWeek2: data.tuesdayHoursWeek2 || 0,
        wednesdayHoursWeek2: data.wednesdayHoursWeek2 || 0,
        thursdayHoursWeek2: data.thursdayHoursWeek2 || 0,
        fridayHoursWeek2: data.fridayHoursWeek2 || 0,
        saturdayHoursWeek2: data.saturdayHoursWeek2 || 0,
        sundayHoursWeek2: data.sundayHoursWeek2 || 0,
      }),
      hourlyRate: hourlyRate,
      additionalExpense: data.additionalExpense || 0,
      notes: data.notes || '',
    };
    
    submitMutation.mutate(timesheetData, {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!selectedWeek) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span>Timesheet for {selectedWeek.rangeFormatted}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Week Info Alert */}
          <Alert className={`${isWeekSubmitted ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
            <Calendar className={`h-4 w-4 ${isWeekSubmitted ? 'text-orange-600' : 'text-blue-600'}`} />
            <AlertDescription className={isWeekSubmitted ? 'text-orange-800' : 'text-blue-800'}>
              <strong>You're {isWeekSubmitted ? 'viewing' : 'submitting'} hours for:</strong> {selectedWeek.rangeFormatted}
              {isWeekSubmitted && (
                <span className="ml-2 text-orange-700 flex items-center gap-1">
                  - Already submitted <CheckCircle className="h-4 w-4 text-green-600" />
                </span>
              )}
              {!isWeekSubmitted && !isSubmissionOpenForWeek && (
                <span className="ml-2 text-blue-700">
                  – In Progress. You can submit after {format(addDays(selectedWeek.endDate, 1), 'EEE, MMM dd')}.
                </span>
              )}
            </AlertDescription>
          </Alert>

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
              />

              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                {!isWeekSubmitted && (
                  <Button 
                    type="submit" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={isFormDisabled}
                  >
                    {isSubmitting 
                      ? 'Submitting...' 
                      : !isSubmissionOpenForWeek
                        ? 'In Progress – Submit after period ends'
                        : 'Submit Timesheet'
                    }
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForemanTimesheetDetailModal;