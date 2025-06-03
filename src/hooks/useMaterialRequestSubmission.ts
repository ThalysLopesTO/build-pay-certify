
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface MaterialRequestData {
  jobsiteId: string;
  deliveryDate: Date;
  deliveryTime: string;
  floorUnit?: string;
  materialList: string;
}

export const useMaterialRequestSubmission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaterialRequestData) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated or company not assigned');
      }

      const { error } = await supabase
        .from('material_requests')
        .insert({
          jobsite_id: data.jobsiteId,
          delivery_date: format(data.deliveryDate, 'yyyy-MM-dd'),
          delivery_time: data.deliveryTime,
          floor_unit: data.floorUnit || null,
          material_list: data.materialList,
          submitted_by: user.id,
          company_id: user.companyId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Material Request Submitted',
        description: 'Your material request has been sent to the admin team.',
      });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
    },
    onError: (error) => {
      console.error('Error submitting material request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit material request. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
