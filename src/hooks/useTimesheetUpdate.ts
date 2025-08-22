
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
  gross_pay?: number;
  calculated_tax?: number;
  additional_expense?: number;
  tax_included?: boolean;
  status?: string;
}

export const useTimesheetUpdate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TimesheetUpdateData }) => {
      console.log('Updating timesheet:', {company_id: user?.companyId, id}, data);

      // Include all fields - trigger will handle calculations correctly
      const { ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('weekly_timesheets')
        .update({
          ...updateData,
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
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
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
