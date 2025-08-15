import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface ResetPasswordData {
  targetUserId: string;
  newPassword: string;
  targetUserEmail: string;
  targetUserName: string;
}

interface UpdateOwnPasswordData {
  password: string;
}

// Permission logic based on user roles
export const canResetPassword = (adminRole: string, targetRole: string): boolean => {
  // Admins can reset passwords for Employee, Foreman, Manager (but not Admin)
  if (adminRole === 'admin' || adminRole === 'super_admin') {
    return targetRole !== 'admin' && targetRole !== 'super_admin';
  }
  
  // Managers can reset passwords for Employee and Foreman (but not Manager or Admin)
  if (adminRole === 'management') {
    return targetRole === 'employee' || targetRole === 'foreman';
  }
  
  // Foremen and Employees cannot reset anyone's password
  return false;
};

export const useResetUserPassword = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      if (!user) throw new Error('User not authenticated');

      // Call the edge function to reset the password
      // The edge function will handle logging internally
      const { data: result, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          targetUserId: data.targetUserId,
          newPassword: data.newPassword,
          targetUserEmail: data.targetUserEmail,
          targetUserName: data.targetUserName
        }
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Password Reset Successfully",
        description: `Password has been reset for ${variables.targetUserName}`
      });
    },
    onError: (error) => {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset password. Please try again.",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateOwnPassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateOwnPasswordData) => {
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