import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCreateManualTimesheet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createManualTimesheet = useMutation({
    mutationFn: async (timesheetData: any) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating manual timesheet with data:', timesheetData);
      
      // First check if a timesheet already exists for this manual entry
      const { data: existingTimesheet, error: checkError } = await supabase
        .from('weekly_timesheets')
        .select('id')
        .eq('manual_entry_name', timesheetData.manual_entry_name)
        .eq('jobsite_id', timesheetData.jobsite_id)
        .eq('week_start_date', timesheetData.week_start_date)
        .eq('is_manual_entry', true)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing timesheet:', checkError);
        throw new Error('Failed to check existing timesheets');
      }

      if (existingTimesheet) {
        throw new Error('A timesheet already exists for this employee, jobsite, and week. Please edit the existing timesheet instead.');
      }
      
      // Add required fields for manual entries
      const dataToInsert = {
        ...timesheetData,
        submitted_by: user.id, // Use current admin as submitter
        company_id: user.companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Data being inserted into database:', dataToInsert);

      const { data, error } = await supabase
        .from('weekly_timesheets')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database error: ${error.message} - ${error.details || error.hint || 'No additional details'}`);
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Manual timesheet created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast({
        title: "Success",
        description: "Manual timesheet created successfully!",
      });
    },
    onError: (error) => {
      console.error('Create manual timesheet error:', error);
      toast({
        title: "Error",
        description: "Failed to create manual timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createManualTimesheet: createManualTimesheet.mutate,
    isCreating: createManualTimesheet.isPending,
  };
};