import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RolePermission {
  id?: string;
  company_id: string;
  role: string;
  menu_item_id: string;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

// Fetch role permissions for the company
export const useRolePermissions = () => {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('menu_item_id', { ascending: true });
      
      if (error) throw error;
      return data as RolePermission[];
    }
  });
};

// Mutation to update role permissions (batch update)
export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissions: RolePermission[]) => {
      // Upsert permissions (insert or update)
      const { error } = await supabase
        .from('role_permissions')
        .upsert(permissions, { 
          onConflict: 'company_id,role,menu_item_id',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permissions saved successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to save permissions: ${error.message}`);
      console.error('Error saving permissions:', error);
    }
  });
};
