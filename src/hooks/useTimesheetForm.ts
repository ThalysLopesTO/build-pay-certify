
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useTimesheetSubmission } from './useTimesheetSubmission';
import { useWorkWeek } from './useWorkWeek';
import { toast } from './use-toast';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  mondayHours: z.number().min(0).max(24),
  tuesdayHours: z.number().min(0).max(24),
  wednesdayHours: z.number().min(0).max(24),
  thursdayHours: z.number().min(0).max(24),
  fridayHours: z.number().min(0).max(24),
  saturdayHours: z.number().min(0).max(24),
  sundayHours: z.number().min(0).max(24),
  additionalExpense: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const useTimesheetForm = () => {
  const { user, session } = useAuth();
  const submitMutation = useTimesheetSubmission();
  const workWeek = useWorkWeek();

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
    },
  });

  const watchedValues = form.watch();
  const totalHours = (
    watchedValues.mondayHours + watchedValues.tuesdayHours + 
    watchedValues.wednesdayHours + watchedValues.thursdayHours + 
    watchedValues.fridayHours + watchedValues.saturdayHours + 
    watchedValues.sundayHours
  );

  // Use the hourly rate directly from the user profile to ensure consistency
  const hourlyRate = user?.hourlyRate || 25;
  // Calculate gross pay for preview only - this won't be sent to the database
  const grossPay = (totalHours * hourlyRate) + (watchedValues.additionalExpense || 0);

  const onSubmit = (data: FormData) => {
    console.log('📋 Form submission started with data:', data);
    console.log('👤 Current user state:', { 
      userId: user?.id, 
      companyId: user?.companyId, 
      email: user?.email,
      isAuthenticated: !!user?.id,
      hasSession: !!session,
      sessionValid: !!session?.access_token
    });
    
    // Enhanced validation checks
    if (totalHours === 0) {
      toast({
        title: "No Hours Entered",
        description: "Please enter at least one hour for the week",
        variant: "destructive",
      });
      return;
    }

    if (!session?.access_token) {
      console.error('❌ Session validation failed: No valid session');
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      console.error('❌ Authentication validation failed: No user ID');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit a timesheet. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.companyId) {
      console.error('❌ Company validation failed: No company ID');
      toast({
        title: "Company Assignment Error", 
        description: "No company assigned to your account. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    if (!workWeek) {
      console.error('❌ Work week not available');
      toast({
        title: "Configuration Error",
        description: "Unable to determine current work week. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    const timesheetData = {
      jobsiteId: data.jobsiteId,
      weekStartDate: workWeek.weekStartDateString,
      mondayHours: data.mondayHours,
      tuesdayHours: data.tuesdayHours,
      wednesdayHours: data.wednesdayHours,
      thursdayHours: data.thursdayHours,
      fridayHours: data.fridayHours,
      saturdayHours: data.saturdayHours,
      sundayHours: data.sundayHours,
      hourlyRate: hourlyRate,
      additionalExpense: data.additionalExpense || 0,
      notes: data.notes || '',
    };
    
    console.log('🚀 Submitting timesheet with processed data:', timesheetData);
    submitMutation.mutate(timesheetData);
  };

  return {
    form,
    totalHours,
    hourlyRate,
    grossPay,
    onSubmit,
    submitMutation,
    workWeek,
  };
};
