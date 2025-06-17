
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteEmployeeResponse {
  success: boolean;
  error?: string;
  deleted_user_id?: string;
  deleted_profile_id?: string;
}

export const useEmployeeDelete = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employeeUserId: string) => {
      console.log('Deleting employee with user ID:', employeeUserId);
      
      const { data, error } = await supabase.rpc('delete_employee', {
        employee_user_id: employeeUserId
      });

      if (error) {
        console.error('Error calling delete_employee function:', error);
        throw error;
      }

      // Type check and cast the response
      const response = data as unknown as DeleteEmployeeResponse;
      
      // Check if the function returned an error result
      if (response && !response.success) {
        console.error('Delete employee function error:', response.error);
        throw new Error(response.error || 'Unknown error occurred during deletion');
      }

      console.log('Employee deleted successfully:', response);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch employee directory
      queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
      
      toast({
        title: "Success",
        description: "Employee successfully deleted",
      });
    },
    onError: (error: any) => {
      console.error('Delete employee mutation error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Error deleting employee",
        variant: "destructive",
      });
    },
  });
};
