import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PermanentlyDeleteEmployeeResponse {
  success: boolean;
  error?: string;
  deleted_user_id?: string;
  deleted_profile_id?: string;
  message?: string;
}

export const usePermanentlyDeleteEmployee = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employeeUserId: string) => {
      console.log('Permanently deleting employee with user ID:', employeeUserId);
      
      const { data, error } = await supabase.rpc('permanently_delete_employee', {
        employee_user_id: employeeUserId
      });

      if (error) {
        console.error('Error calling permanently_delete_employee function:', error);
        throw error;
      }

      const response = data as unknown as PermanentlyDeleteEmployeeResponse;
      
      if (response && !response.success) {
        console.error('Permanently delete employee function error:', response.error);
        throw new Error(response.error || 'Unknown error occurred during permanent deletion');
      }

      console.log('Employee permanently deleted:', response);
      return response;
    },
    onSuccess: () => {
      // Invalidate both active and archived employee queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['archived-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
      
      toast({
        title: "Success",
        description: "Employee permanently deleted from system. This action cannot be undone.",
      });
    },
    onError: (error: any) => {
      console.error('Permanently delete employee mutation error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Error permanently deleting employee",
        variant: "destructive",
      });
    },
  });
};
