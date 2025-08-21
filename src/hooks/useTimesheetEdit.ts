
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
      console.log('🔍 Edit timesheet attempt:', {
        userId: user?.id,
        userRole: user?.role,
        companyId: user?.companyId,
        timesheetId: data.id
      });

      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated');
      }

      // Check user role - only certain roles can edit timesheets
      if (!user.role || !['admin', 'super_admin', 'management', 'foreman'].includes(user.role)) {
        throw new Error('You do not have permission to edit timesheets');
      }

      // First, get the original timesheet data with company verification
      const { data: originalTimesheet, error: fetchError } = await supabase
        .from('weekly_timesheets')
        .select('*')
        .eq('id', data.id)
        .eq('company_id', user.companyId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching original timesheet:', fetchError);
        throw fetchError;
      }

      if (!originalTimesheet) {
        throw new Error('Timesheet not found or access denied');
      }

      console.log('📋 Original timesheet found:', originalTimesheet);

      // Update the timesheet with company verification
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
          ei_rate: data.ei_rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .eq('company_id', user.companyId)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('❌ Error updating timesheet:', updateError);
        throw updateError;
      }

      if (!updatedTimesheet) {
        throw new Error('Failed to update timesheet - no data returned');
      }

      console.log('✅ Timesheet updated successfully:', updatedTimesheet);

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
