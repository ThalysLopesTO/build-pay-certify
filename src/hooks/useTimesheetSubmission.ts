
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
}

export const useTimesheetSubmission = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TimesheetData) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated or company not assigned');
      }

      console.log('Submitting timesheet:', data);

      const { data: result, error } = await supabase
        .from('weekly_timesheets')
        .insert({
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
        })
        .select()
        .single();

      if (error) {
        console.error('Timesheet submission error:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('Timesheet submitted successfully:', data);
      toast({
        title: "Timesheet Submitted",
        description: `Weekly timesheet for ${data.total_hours} hours submitted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
    onError: (error) => {
      console.error('Failed to submit timesheet:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });
};
