
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface TimesheetUpdateData {
  jobsite_id?: string;
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
  sunday_hours?: number;
  total_hours?: number;
  status?: string;
}

export const useTimesheetUpdate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TimesheetUpdateData }) => {
      console.log('Updating timesheet:', id, data);

      const { data: result, error } = await supabase
        .from('weekly_timesheets')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('company_id', user?.companyId) // Ensure user can only update their company's timesheets
        .select()
        .single();

      if (error) {
        console.error('Timesheet update error:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('Timesheet updated successfully:', data);
      toast({
        title: "Timesheet Updated",
        description: "The timesheet has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-timesheets'] });
    },
    onError: (error) => {
      console.error('Failed to update timesheet:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });
};
