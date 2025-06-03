
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEmployeeDirectory = () => {
  return useQuery({
    queryKey: ['employee-directory'],
    queryFn: async () => {
      console.log('Fetching employee directory...');
      
      const { data, error } = await supabase.auth.admin.listUsers();

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      // Filter to only show employees (excluding admins and other roles)
      const employees = data.users.filter(user => 
        user.user_metadata?.role === 'employee' || 
        user.user_metadata?.role === 'foreman'
      );

      console.log('Fetched employees:', employees);
      return employees;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
