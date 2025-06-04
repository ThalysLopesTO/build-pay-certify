
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TimesheetData) => {
      console.log('🔍 Starting timesheet submission with user:', { 
        userId: user?.id, 
        companyId: user?.companyId,
        email: user?.email 
      });

      if (!user?.id || !user?.companyId) {
        console.error('❌ Authentication check failed:', { userId: user?.id, companyId: user?.companyId });
        throw new Error('User not authenticated or company not assigned');
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
          throw new Error('Permission denied: Unable to submit timesheet. Please contact your administrator.');
        }
        
        if (error.code === 'PGRST301') {
          throw new Error('Database constraint violation. Please check your timesheet data.');
        }
        
        if (error.message?.includes('duplicate key')) {
          throw new Error('A timesheet for this week already exists. Please edit the existing timesheet instead.');
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
