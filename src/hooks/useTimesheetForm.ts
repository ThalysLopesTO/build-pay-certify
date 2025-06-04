
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useTimesheetSubmission } from './useTimesheetSubmission';
import { toast } from './use-toast';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  weekStartDate: z.string().min(1, 'Please select week ending date'),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsiteId: '',
      weekStartDate: '',
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

  const hourlyRate = parseFloat(user?.user_metadata?.hourly_rate || '25');
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

    // Calculate week start date from the selected week ending date
    const weekEndDate = new Date(data.weekStartDate);
    const weekStart = new Date(weekEndDate);
    weekStart.setDate(weekEndDate.getDate() - 6); // Get Monday (7 days before Sunday)
    
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
      additionalExpense: data.additionalExpense || 0,
      notes: data.notes || '',
    };
    
    console.log('🚀 Submitting timesheet with processed data:', timesheetData);
    submitMutation.mutate(timesheetData);
  };

  // Generate week ending dates for the select dropdown (next 8 weeks)
  const getWeekEndingDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (7 * i) - today.getDay()); // Get next Sunday
      dates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MMM dd, yyyy')
      });
    }
    return dates;
  };

  return {
    form,
    totalHours,
    hourlyRate,
    grossPay,
    onSubmit,
    submitMutation,
    weekEndingDates: getWeekEndingDates(),
  };
};
