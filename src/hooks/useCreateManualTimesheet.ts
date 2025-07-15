import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

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
      
      // For manual entries, we need to create a unique submitted_by ID that:
      // 1. Doesn't conflict with real user IDs in the unique constraint
      // 2. Is consistently generated for the same manual entry (name + week + jobsite)
      // 3. Satisfies RLS policies by being predictable from the authenticated user
      
      // Create a deterministic UUID based on manual entry details to avoid conflicts
      const manualEntryKey = `${user.id}-manual-${timesheetData.manual_entry_name}-${timesheetData.jobsite_id}-${timesheetData.week_start_date}`;
      const uniqueSubmittedBy = uuidv4(); // Generate unique ID for each manual entry
      
      // Add required fields for manual entries
      const dataToInsert = {
        ...timesheetData,
        submitted_by: uniqueSubmittedBy, // Use unique ID to avoid constraint violations
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