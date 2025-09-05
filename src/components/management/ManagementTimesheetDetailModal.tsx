import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle, CheckCircle, Save, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTimesheetSubmission } from '@/hooks/useTimesheetSubmission';
import { useTimesheetData } from '@/hooks/useTimesheetData';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { isSubmissionOpen } from '@/lib/time/periods';
import { format } from 'date-fns';
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
  additionalExpense: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  tax_included: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ManagementTimesheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeek: any;
  existingTimesheets: string[];
}

const ManagementTimesheetDetailModal = ({ 
  isOpen, 
  onClose, 
  selectedWeek, 
  existingTimesheets 
}: ManagementTimesheetDetailModalProps) => {
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const submitMutation = useTimesheetSubmission();
  
  // Fetch existing timesheet data for the selected week
  const { data: existingTimesheetData } = useTimesheetData({
    userId: user?.id,
    weekStartDate: selectedWeek?.weekStartDateString,
    enabled: !!selectedWeek?.weekStartDateString && !!user?.id
  });

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
      additionalExpense: 0,
      notes: '',
      tax_included: false,
    },
  });

  // Load existing timesheet data when available
  React.useEffect(() => {
    if (isOpen && existingTimesheetData) {
      const formData: FormData = {
        jobsiteId: existingTimesheetData.jobsite_id || '',
        mondayHours: existingTimesheetData.monday_hours || 0,
        tuesdayHours: existingTimesheetData.tuesday_hours || 0,
        wednesdayHours: existingTimesheetData.wednesday_hours || 0,
        thursdayHours: existingTimesheetData.thursday_hours || 0,
        fridayHours: existingTimesheetData.friday_hours || 0,
        saturdayHours: existingTimesheetData.saturday_hours || 0,
        sundayHours: existingTimesheetData.sunday_hours || 0,
        additionalExpense: existingTimesheetData.additional_expense || 0,
        notes: existingTimesheetData.notes || '',
        tax_included: existingTimesheetData.tax_included || false,
      };

      form.reset(formData);
    } else if (isOpen && !existingTimesheetData) {
      // Reset to defaults if no existing data
      form.reset({
        jobsiteId: '',
        mondayHours: 0,
        tuesdayHours: 0,
        wednesdayHours: 0,
        thursdayHours: 0,
        fridayHours: 0,
        saturdayHours: 0,
        sundayHours: 0,
        additionalExpense: 0,
        notes: '',
        tax_included: false,
      });
    }
  }, [isOpen, existingTimesheetData, form]);

  const watchedValues = form.watch();
  const totalHours = (
    watchedValues.mondayHours + watchedValues.tuesdayHours + 
    watchedValues.wednesdayHours + watchedValues.thursdayHours + 
    watchedValues.fridayHours + watchedValues.saturdayHours + 
    watchedValues.sundayHours
  );

  const hourlyRate = parseFloat(user?.user_metadata?.hourly_rate || '25');
  const grossPay = (totalHours * hourlyRate) + (watchedValues.additionalExpense || 0);

  const isWeekSubmitted = selectedWeek ? existingTimesheets.includes(selectedWeek.weekStartDateString) : false;
  const isSubmitting = submitMutation.isPending;
  const isSubmissionOpenForWeek = selectedWeek ? isSubmissionOpen(selectedWeek.endDate) : false;
  const isFormDisabled = isWeekSubmitted || isSubmitting || !isSubmissionOpenForWeek;

  const onSubmit = (data: FormData) => {
    if (!selectedWeek) return;

    const totalHours = data.mondayHours + data.tuesdayHours + data.wednesdayHours + 
                       data.thursdayHours + data.fridayHours + data.saturdayHours + data.sundayHours;
    const hoursPayAmount = totalHours * hourlyRate;
    const additionalExpenseAmount = data.additionalExpense || 0;
    const grossPay = hoursPayAmount + additionalExpenseAmount;
    
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
      hourlyRate: hourlyRate,
      additionalExpense: additionalExpenseAmount,
      notes: data.notes || '',
      taxIncluded: data.tax_included || false,
      periods: [{ // Single period data
        week1: {
          mondayHours: data.mondayHours,
          tuesdayHours: data.tuesdayHours,
          wednesdayHours: data.wednesdayHours,
          thursdayHours: data.thursdayHours,
          fridayHours: data.fridayHours,
          saturdayHours: data.saturdayHours,
          sundayHours: data.sundayHours,
        }
      }],
      tax: data.tax_included ? grossPay * 0.13 : 0, // 13% HST if tax included
      total_hours: totalHours,
      gross_pay: grossPay,
      hours_pay: hoursPayAmount,
      total_pay: data.tax_included ? grossPay + (grossPay * 0.13) : grossPay,
    };
    
    submitMutation.mutate(timesheetData, {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    });
  };

  const handleSaveDraft = () => {
    // TODO: Implement draft saving functionality
    console.log('Save draft functionality to be implemented');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    console.log('Export PDF functionality to be implemented');
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
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span>My Timesheet - {selectedWeek.rangeFormatted}</span>
            </div>
            <div className="flex items-center space-x-2">
              {/* Status Badge */}
              {isWeekSubmitted ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Submitted
                </span>
              ) : isSubmissionOpenForWeek ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Open for Submission
                </span>
              ) : (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                  Draft - Available {format(selectedWeek.endDate, 'MMM dd')}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Week Info Alert */}
          <Alert className={`${isWeekSubmitted ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
            <Calendar className={`h-4 w-4 ${isWeekSubmitted ? 'text-orange-600' : 'text-blue-600'}`} />
            <AlertDescription className={isWeekSubmitted ? 'text-orange-800' : 'text-blue-800'}>
              <strong>You're {isWeekSubmitted ? 'viewing' : 'editing'} your timesheet for:</strong> {selectedWeek.rangeFormatted}
              {isWeekSubmitted && (
                <span className="ml-2 text-orange-700 flex items-center gap-1">
                  - Already submitted <CheckCircle className="h-4 w-4 text-green-600" />
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Submission Availability Alert */}
          {!isWeekSubmitted && !isSubmissionOpenForWeek && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Submission Not Available:</strong> You can submit this timesheet starting {format(selectedWeek.endDate, 'EEEE, MMM dd')} (the last day of the period).
              </AlertDescription>
            </Alert>
          )}

          {/* Manager Timesheet Note */}
          {!isWeekSubmitted && isSubmissionOpenForWeek && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Manager Timesheet:</strong> Your timesheet will require approval from a different manager or administrator. 
                You cannot approve your own timesheet submissions.
              </AlertDescription>
            </Alert>
          )}

          {/* Already Submitted Warning */}
          {isWeekSubmitted && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Timesheet Submitted:</strong> This timesheet has been submitted for approval.
                Contact your administrator if changes are needed.
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
                workerType={user?.workerType || user?.user_metadata?.worker_type || 'employee'}
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
                  <>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="flex items-center space-x-2"
                      disabled={isSubmitting}
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Draft</span>
                    </Button>
                    
                    <Button 
                      type="submit" 
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      disabled={isFormDisabled || totalHours === 0}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                  </>
                )}

                {isWeekSubmitted && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleExportPDF}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export PDF</span>
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

export default ManagementTimesheetDetailModal;