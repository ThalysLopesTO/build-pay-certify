
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface EditTimesheetData {
  id: string;
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
  sunday_hours?: number;
  additional_expense?: number;
  total_hours?: number;
  gross_pay?: number;
  tax_included?: boolean;
  calculated_tax?: number;
  income_tax_rate?: number;
  cpp_rate?: number;
  ei_rate?: number;
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
        .from('weekly_timesheets')
        .select('*')
        .eq('id', data.id)
        .single();

      if (fetchError) {
        console.error('Error fetching original timesheet:', fetchError);
        throw fetchError;
      }

      // Update the timesheet (gross_pay and total_hours are calculated by database trigger)
      const { data: updatedTimesheet, error: updateError } = await supabase
        .from('weekly_timesheets')
        .update({
          monday_hours: data.monday_hours,
          tuesday_hours: data.tuesday_hours,
          wednesday_hours: data.wednesday_hours,
          thursday_hours: data.thursday_hours,
          friday_hours: data.friday_hours,
          saturday_hours: data.saturday_hours,
          sunday_hours: data.sunday_hours,
          additional_expense: data.additional_expense,
          tax_included: data.tax_included,
          calculated_tax: data.calculated_tax,
          income_tax_rate: data.income_tax_rate,
          cpp_rate: data.cpp_rate,
          ei_rate: data.ei_rate
        })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating timesheet:', updateError);
        throw updateError;
      }

      // Create audit log entry for weekly timesheets
      const { error: auditError } = await supabase
        .from('weekly_timesheet_audit_logs')
        .insert({
          edited_by_user_id: user.id,
          timesheet_id: data.id,
          changes: {
            original: {
              monday_hours: originalTimesheet.monday_hours,
              tuesday_hours: originalTimesheet.tuesday_hours,
              wednesday_hours: originalTimesheet.wednesday_hours,
              thursday_hours: originalTimesheet.thursday_hours,
              friday_hours: originalTimesheet.friday_hours,
              saturday_hours: originalTimesheet.saturday_hours,
              sunday_hours: originalTimesheet.sunday_hours,
              additional_expense: originalTimesheet.additional_expense,
              total_hours: originalTimesheet.total_hours,
              gross_pay: originalTimesheet.gross_pay
            },
            updated: {
              monday_hours: data.monday_hours,
              tuesday_hours: data.tuesday_hours,
              wednesday_hours: data.wednesday_hours,
              thursday_hours: data.thursday_hours,
              friday_hours: data.friday_hours,
              saturday_hours: data.saturday_hours,
              sunday_hours: data.sunday_hours,
              additional_expense: data.additional_expense,
              total_hours: data.total_hours,
              gross_pay: data.gross_pay
            }
          },
          notes: data.note,
          company_id: user.companyId,
        });

      if (auditError) {
        console.error('Error creating audit log:', auditError);
        // Don't throw here as the main update succeeded
      }

      return updatedTimesheet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast({
        title: "Success",
        description: "Timesheet updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Edit timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    editTimesheet: editTimesheet.mutate,
    isEditing: editTimesheet.isPending,
  };
};
