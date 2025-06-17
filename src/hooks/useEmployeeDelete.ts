
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      // Check if the function returned an error result
      if (data && !data.success) {
        console.error('Delete employee function error:', data.error);
        throw new Error(data.error);
      }

      console.log('Employee deleted successfully:', data);
      return data;
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
