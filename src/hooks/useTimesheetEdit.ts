
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface EditTimesheetData {
  id: string;
  check_in_time?: string;
  check_out_time?: string;
  jobsite_id?: string;
  note?: string;
}

export const useTimesheetEdit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editTimesheet = useMutation({
    mutationFn: async (data: EditTimesheetData) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated');
      }

      // First, get the original timesheet data
      const { data: originalTimesheet, error: fetchError } = await supabase
        .from('timesheets')
        .select('*')
        .eq('id', data.id)
        .single();

      if (fetchError) {
        console.error('Error fetching original timesheet:', fetchError);
        throw fetchError;
      }

      // Update the timesheet
      const { data: updatedTimesheet, error: updateError } = await supabase
        .from('timesheets')
        .update({
          check_in_time: data.check_in_time,
          check_out_time: data.check_out_time,
          jobsite_id: data.jobsite_id,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating timesheet:', updateError);
        throw updateError;
      }

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          edited_by_user_id: user.id,
          employee_id: originalTimesheet.user_id,
          timesheet_id: data.id,
          original_clock_in: originalTimesheet.check_in_time,
          original_clock_out: originalTimesheet.check_out_time,
          new_clock_in: data.check_in_time,
          new_clock_out: data.check_out_time,
          original_jobsite_id: originalTimesheet.jobsite_id,
          new_jobsite_id: data.jobsite_id,
          note: data.note,
          company_id: user.companyId,
        });

      if (auditError) {
        console.error('Error creating audit log:', auditError);
        // Don't throw here as the main update succeeded
      }

      return updatedTimesheet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast({
        title: "Success",
        description: "Punch record updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Edit timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to update punch record. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    editTimesheet: editTimesheet.mutate,
    isEditing: editTimesheet.isPending,
  };
};
