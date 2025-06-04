
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TimesheetData {
  jobsiteId: string;
  weekStartDate: string;
  mondayHours: number;
  tuesdayHours: number;
  wednesdayHours: number;
  thursdayHours: number;
  fridayHours: number;
  saturdayHours: number;
  sundayHours: number;
  hourlyRate: number;
  additionalExpense?: number;
  notes?: string;
}

export const useTimesheetSubmission = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TimesheetData) => {
      console.log('🔍 Starting timesheet submission with user:', { 
        userId: user?.id, 
        companyId: user?.companyId,
        email: user?.email,
        hasSession: !!session,
        sessionValid: !!session?.access_token
      });

      // Enhanced authentication checks
      if (!session?.access_token) {
        console.error('❌ No valid session found');
        throw new Error('Please log out and log back in to submit timesheets');
      }

      if (!user?.id) {
        console.error('❌ No user ID found');
        throw new Error('User not authenticated. Please log out and log back in.');
      }

      if (!user?.companyId) {
        console.error('❌ No company ID found for user');
        throw new Error('No company assigned to your account. Please contact your administrator.');
      }

      // Validate timesheet data
      const totalHours = data.mondayHours + data.tuesdayHours + data.wednesdayHours + 
                        data.thursdayHours + data.fridayHours + data.saturdayHours + data.sundayHours;
      
      if (totalHours === 0) {
        throw new Error('Please enter at least one hour for the week');
      }

      // Only send the required fields - let database calculate total_hours and gross_pay
      const timesheetPayload = {
        submitted_by: user.id,
        company_id: user.companyId,
        jobsite_id: data.jobsiteId,
        week_start_date: data.weekStartDate,
        monday_hours: data.mondayHours,
        tuesday_hours: data.tuesdayHours,
        wednesday_hours: data.wednesdayHours,
        thursday_hours: data.thursdayHours,
        friday_hours: data.fridayHours,
        saturday_hours: data.saturdayHours,
        sunday_hours: data.sundayHours,
        hourly_rate: data.hourlyRate,
        additional_expense: data.additionalExpense || 0,
        notes: data.notes || '',
        status: 'pending',
      };

      console.log('📝 Submitting timesheet to database with payload:', timesheetPayload);

      // Make sure we're using the authenticated session
      const { data: result, error } = await supabase
        .from('weekly_timesheets')
        .insert([timesheetPayload])
        .select('*')
        .single();

      if (error) {
        console.error('💥 Timesheet submission error details:', {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide more specific error messages based on the actual error
        if (error.code === '42501') {
          throw new Error('Permission denied. Please ensure you are logged in and try again. If the problem persists, contact your administrator.');
        }
        
        if (error.code === 'PGRST301') {
          throw new Error('Database constraint violation. Please check your timesheet data.');
        }
        
        if (error.message?.includes('duplicate key')) {
          throw new Error('A timesheet for this week already exists. Please edit the existing timesheet instead.');
        }

        if (error.message?.includes('violates row-level security')) {
          throw new Error('Security policy violation. Please log out and log back in, then try again.');
        }
        
        throw new Error(error.message || 'Failed to submit timesheet');
      }

      console.log('✅ Timesheet submitted successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Timesheet submission successful, invalidating queries');
      toast({
        title: "Timesheet Submitted",
        description: `Weekly timesheet for ${data.total_hours || 0} hours submitted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
    },
    onError: (error) => {
      console.error('🚨 Timesheet submission failed:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });
};
