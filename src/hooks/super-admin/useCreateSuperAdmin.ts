import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateSuperAdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Create another super admin. Calls the create-super-admin-user edge function
 * (service role + super-admin guard).
 */
export const useCreateSuperAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSuperAdminInput) => {
      const { data, error } = await supabase.functions.invoke('create-super-admin-user', { body: input });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { email: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-platform-users'] });
      toast({
        title: 'Super Admin created',
        description: `${data.email} can now sign in at /super-admin/login.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not create Super Admin',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
};
