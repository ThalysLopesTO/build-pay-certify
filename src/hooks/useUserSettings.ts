
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
  photo?: File;
  removePhoto?: boolean;
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

      // Handle photo upload/removal
      let photoUrl: string | null | undefined = undefined;

      if (data.removePhoto) {
        // User wants to remove photo
        photoUrl = null;
      } else if (data.photo) {
        // User uploaded new photo
        const fileExtension = data.photo.name.split('.').pop();
        const fileName = `${user.id}_${crypto.randomUUID()}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, data.photo, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      // Build update payload
      const updatePayload: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        trade: data.trade,
        position: data.position,
        hourly_rate: data.hourly_rate,
        updated_at: new Date().toISOString()
      };

      // Only update photo_url if it changed
      if (photoUrl !== undefined) {
        updatePayload.photo_url = photoUrl;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updatePayload)
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

// Legacy function - use useUpdateOwnPassword from usePasswordManagement instead
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
