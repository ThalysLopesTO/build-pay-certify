
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface UpdateProfileData {
  first_name: string;
  last_name: string;
  trade?: string;
  position?: string;
  hourly_rate?: number;
}

interface UpdatePasswordData {
  password: string;
}

export const useUpdateProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          trade: data.trade,
          position: data.position,
          hourly_rate: data.hourly_rate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });
};

export const useUpdatePassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdatePasswordData) => {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully"
      });
    },
    onError: (error) => {
      console.error('Password update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  });
};
