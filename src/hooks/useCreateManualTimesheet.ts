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
      
      // For manual entries, use the current user's ID as submitted_by
      // This satisfies RLS policies while indicating it's a manual entry through is_manual_entry flag
      
      // Add required fields for manual entries
      const dataToInsert = {
        ...timesheetData,
        submitted_by: user.id, // Use authenticated user's ID for RLS compliance
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