import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReactivateEmployeeResponse {
  success: boolean;
  error?: string;
  reactivated_user_id?: string;
  reactivated_profile_id?: string;
}

export const useEmployeeReactivate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employeeUserId: string) => {
      console.log('Reactivating employee with user ID:', employeeUserId);
      
      const { data, error } = await supabase.rpc('reactivate_employee', {
        employee_user_id: employeeUserId
      });

      if (error) {
        console.error('Error calling reactivate_employee function:', error);
        throw error;
      }

      // Type check and cast the response
      const response = data as unknown as ReactivateEmployeeResponse;
      
      // Check if the function returned an error result
      if (response && !response.success) {
        console.error('Reactivate employee function error:', response.error);
        throw new Error(response.error || 'Unknown error occurred during reactivation');
      }

      console.log('Employee reactivated successfully:', response);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch both employee directory and archived employees
      queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
      queryClient.invalidateQueries({ queryKey: ['archived-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-limit'] });
      
      toast({
        title: "Success",
        description: "Employee successfully reactivated",
      });
    },
    onError: (error: any) => {
      console.error('Reactivate employee mutation error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Error reactivating employee",
        variant: "destructive",
      });
    },
  });
};