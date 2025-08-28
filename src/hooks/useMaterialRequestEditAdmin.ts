import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'react-hot-toast';

interface UpdateMaterialRequestData {
  id: string;
  jobsiteId: string;
  deliveryDate: Date;
  deliveryTime: string;
  floorUnit?: string;
  materialList: string;
}

export const useMaterialRequestEditAdmin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMaterialRequestData) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('material_requests')
        .update({
          jobsite_id: data.jobsiteId,
          delivery_date: data.deliveryDate.toISOString().split('T')[0],
          delivery_time: data.deliveryTime,
          floor_unit: data.floorUnit,
          material_list: data.materialList,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both admin and regular material request queries
      queryClient.invalidateQueries({ queryKey: ['admin-material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      toast.success('Material request updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating material request:', error);
      toast.error('Failed to update material request. Please try again.');
    },
  });
};