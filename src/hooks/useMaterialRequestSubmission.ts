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
  takeoffItems?: Array<{
    takeoffId: string;
    requestedQty: number;
  }>;
}

export const useMaterialRequestSubmission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaterialRequestData) => {
      if (!user?.id || !user?.companyId) {
        throw new Error('User not authenticated');
      }

      console.log('Submitting material request:', data);

      // Insert the main material request
      const { data: materialRequest, error: requestError } = await supabase
        .from('material_requests')
        .insert({
          jobsite_id: data.jobsiteId,
          delivery_date: data.deliveryDate.toISOString().split('T')[0],
          delivery_time: data.deliveryTime,
          floor_unit: data.floorUnit || null,
          material_list: data.materialList,
          status: 'pending',
          submitted_by: user.id,
          company_id: user.companyId,
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error creating material request:', requestError);
        throw requestError;
      }

      // If there are takeoff items, create the junction records
      if (data.takeoffItems && data.takeoffItems.length > 0) {
        const takeoffRequests = data.takeoffItems.map(item => ({
          material_request_id: materialRequest.id,
          material_takeoff_id: item.takeoffId,
          requested_qty: item.requestedQty,
          is_unplanned: false,
        }));

        const { error: takeoffError } = await supabase
          .from('material_takeoff_requests')
          .insert(takeoffRequests);

        if (takeoffError) {
          console.error('Error creating takeoff requests:', takeoffError);
          throw takeoffError;
        }
      }

      // If there are items not in takeoff (in materialList), mark as unplanned
      if (data.materialList.trim()) {
        const { error: unplannedError } = await supabase
          .from('material_takeoff_requests')
          .insert({
            material_request_id: materialRequest.id,
            material_takeoff_id: null,
            requested_qty: 0,
            is_unplanned: true,
            justification: 'Items listed in material list section'
          });

        if (unplannedError) {
          console.error('Error creating unplanned request record:', unplannedError);
          // Don't throw error here as this is supplementary
        }
      }

      return materialRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
      toast({
        title: "Success!",
        description: "Your material request has been submitted successfully.",
      });
    },
    onError: (error) => {
      console.error('Material request submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit material request. Please try again.",
        variant: "destructive",
      });
    },
  });
};
